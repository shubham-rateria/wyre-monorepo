import isArrayType from "../../helpers/isArrayType";
import isPrimitiveType from "../../helpers/isPrimitiveType";
import { Timestamp, TimestampValue } from "../../lamport/index";
import { TPatch } from "../../types/patch.type";
import { ObservableObject } from "../object/observable-object";
import { ArraySerializedValue } from "../utils/serialize";
import { arrayToJSON } from "../utils/toJSON";
import { Key, KEY_DELTA } from "./key/key";
import { apply, convertIndexedToCrdtPath } from "./patch/patch";

const MIN_ARR_VALUE = 0;
const MAX_ARR_INIT_VALUE = 0.9;
const MAX_ARR_VALUE = 1;

export interface ArrayValue {
  key: Key;
  value: any;
  tombstone: boolean;
  timestamp: Timestamp;
  isPrimitive: boolean;
}

type TSimpleValue = number | string | null | undefined | object;

type TEventTypes = "itemchanged" | "itemadded" | "itemdeleted" | "iteminserted";

type TEvent = {
  type: TEventTypes;
  path: string;
  value?: TSimpleValue;
  timestamp: TimestampValue;
};

const canWrite = (rawValue: ArrayValue, incomingTimestamp: Timestamp) => {
  return rawValue.timestamp.lessThan(incomingTimestamp);
};

interface ObservableArrayParams {
  items: any;
  emitPatch: (patch: TPatch) => void;
  actorId: string;
  collectionName: string;

  /**
   * onChange will trigger when either I have changed a value,
   * or when another user has overwritten my value
   */
  onChange: (patch?: TPatch) => void;
}

export default function ObservableArray({
  items,
  emitPatch,
  actorId,
  collectionName,
  onChange,
}: ObservableArrayParams) {
  var _self = this,
    /**
     * this will always be sorted according to the key value
     */
    _array: ArrayValue[] = [],
    _actorId: string = actorId,
    _handlers: { [key: string]: any[] } = {
      itemadded: [],
      itemdeleted: [],
      itemchanged: [],
      iteminsert: [],
    };

  function getElementAtIndex(index: number) {
    /**
     * find the indexed'th number that is not a
     * tombstone.
     * // TODO: this will start causing issues when
     * the number of array elements increase a lot.
     * We will need to find a way to optimize this
     */
    let nonDeleted = -1;
    for (let i = 0; i < _array.length; i++) {
      const rawValue: ArrayValue = _array[i];
      if (!rawValue.tombstone) {
        nonDeleted++;
      }
      if (nonDeleted === index) {
        return rawValue;
      }
    }
    return undefined;
  }

  function defineIndexProperty(index: string | number) {
    Object.defineProperty(_self, index, {
      configurable: true,
      enumerable: true,
      get: function () {
        console.log("[arr:get:req]", index, Key.isCrdtKey(index.toString()));
        if (Key.isCrdtKey(index.toString())) {
          console.log(
            "[arr:get:req:crdtindex]",
            index,
            Key.isCrdtKey(index.toString())
          );
          const arrayIndex = crdtIndexToArrayIndex(index.toString());
          if (arrayIndex === -1) {
            /**
             * TODO: what to do when an unknown CRDT index
             * arrives?
             */
            console.error("Invalid CRDT index");
            return undefined;
          }
          const rawValue: ArrayValue = _array[arrayIndex];
          return rawValue?.value;
        } else {
          /**
           * If we are querying by array index,
           * the value at index might be tombstoned.
           * To take care of this case, we have to find
           * the next non-tombstoned value to send
           */

          const rawValue: ArrayValue | undefined = getElementAtIndex(
            parseInt(index.toString())
          );

          console.log("[arr:get]", index, rawValue);
          return rawValue?.value;
        }
      },
      set: function (v) {
        /**
         * index may or may not be in the array
         */

        /**
         * we have to check if the index is a crdt key
         * or not and process accordingly
         */

        const rawValue: ArrayValue | undefined = getElementAtIndex(
          parseInt(index.toString())
        );

        if (!rawValue) {
          return;
        }

        rawValue.timestamp.increment();
        rawValue.timestamp.timestamp.actorId = _actorId;
        rawValue.value = v;
        raiseEvent({
          type: "itemchanged",
          path: "/" + rawValue.key.toString(),
          timestamp: rawValue.timestamp.timestamp,
          value: v,
        });
      },
    });
  }

  function setRawValues(values: ArraySerializedValue[]) {
    console.log("[setrawvalues:array]", values);
    for (let i = 0; i < values.length; i++) {
      const item = values[i];
      const key = new Key(item.key.fractionalId.toString());
      const timestamp = new Timestamp(
        item.timestamp.timestamp.actorId,
        item.timestamp.timestamp.seq
      );
      let valueToSet: any;
      console.log("[setrawvalues:array:item]", item, key, timestamp);
      if (
        typeof item.value === "object" &&
        !Array.isArray(item.value) &&
        item.value !== null &&
        !item.isSerialized
      ) {
        // const newItem = new ObservableObject(
        //   {},
        //   handleNonPrimitiveChildChange(key.toString()),
        //   actorId,
        //   onSet
        // );
        const newItem = new ObservableObject({
          object: {},
          emitPatch: handleNonPrimitiveChildChange(key.toString()),
          actorId,
          collectionName,
          onChange,
        });
        newItem.setRawValues(item.value);
        valueToSet = newItem;
      } else if (Array.isArray(item.value)) {
        // const newItem = new ObservableArray(
        //   [],
        //   handleNonPrimitiveChildChange(key.toString()),
        //   _actorId,
        //   onSet
        // );
        const newItem = new ObservableArray({
          items: [],
          emitPatch: handleNonPrimitiveChildChange(key.toString()),
          actorId,
          collectionName,
          onChange,
        });
        newItem.setRawValues(item.value);
        valueToSet = newItem;
      } else {
        valueToSet = item.value;
      }

      /**
       * if the key exists, compare timestamps
       * and apply change
       */
      const arrayIndex = crdtIndexToArrayIndex(key.toString());
      console.log("[setrawvalues:array:arrayIndex]", arrayIndex);
      if (arrayIndex !== -1) {
        const arrayValue: ArrayValue = _array[arrayIndex];
        if (arrayValue.timestamp.lessThan(timestamp) && !arrayValue.tombstone) {
          console.log("[setrawvalues:array:existing ts]", arrayValue);
          arrayValue.timestamp = timestamp;
          arrayValue.value = valueToSet;
        }
      } else {
        console.log("[setrawvalues:array:new]", item);
        item.timestamp = timestamp;
        item.key = key;
        _array.push({ ...item, key, timestamp, value: valueToSet });
        defineIndexProperty(i);
        defineIndexProperty(key.toString());
      }
    }
  }

  Object.defineProperty(_self, "setRawValues", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (values: ArraySerializedValue[]) {
      setRawValues(values);
    },
  });

  function getRawValue(key: string) {
    return _array[key];
  }

  Object.defineProperty(_self, "getRawValue", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (key: string) {
      return getRawValue(key);
    },
  });

  function getRawValueAtArrayIndex(index: number) {
    return getElementAtIndex(index);
  }

  Object.defineProperty(_self, "getRawValueAtArrayIndex", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (index: number) {
      return getRawValueAtArrayIndex(index);
    },
  });

  Object.defineProperty(_self, "toJSON", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function () {
      return arrayToJSON(_self);
    },
  });

  Object.defineProperty(_self, "setValueFromPatch", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (
      crdtIndex: string,
      value: any,
      timestampValue: TimestampValue
    ) {
      if (!Key.isCrdtKey(crdtIndex.toString())) {
        throw new Error("Only CRDT keys can be used to apply patch on array.");
      }

      const timestamp = new Timestamp(
        timestampValue.actorId,
        timestampValue.seq
      );

      const key = Key.fromString(crdtIndex);

      let arrayIndex = crdtIndexToArrayIndex(crdtIndex);

      const rawValue: ArrayValue = _array[arrayIndex];
      const transformedValue = getValueToSet(key.toString(), value);

      if (rawValue && canWrite(rawValue, timestamp) && !rawValue.tombstone) {
        rawValue.value = transformedValue;
        rawValue.timestamp = timestamp;
        onChange();
      }
    },
  });

  Object.defineProperty(_self, "addNewValueFromPatch", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (
      /**
       * Index is a crdt index
       */
      crdtIndex: string,
      value: any,
      timestampValue: TimestampValue
    ) {
      /**
       * Check if key exists.
       * If it does, compare the timestamp
       * If the timestamp is greater than the one
       * I have, update the key.
       * Else do not.
       */

      if (!Key.isCrdtKey(crdtIndex.toString())) {
        throw new Error("Only CRDT keys can be used to apply patch on array.");
      }

      const timestamp = new Timestamp(
        timestampValue.actorId,
        timestampValue.seq
      );

      const key = Key.fromString(crdtIndex);
      const transformedValue = getValueToSet(key.toString(), value);

      /**
       * TODO: technically this should never happen that
       * we have to change a value that has come from an add patch.
       * Causality says that it should have been created before modified.
       * This will happen only when we have not seen the add patch
       * seen replace then seeing add.
       */
      if (crdtIndexToArrayIndex(crdtIndex) !== -1) {
        const changeIndex = crdtIndexToArrayIndex(crdtIndex);

        const rawValue = _array[changeIndex];

        if (canWrite(rawValue, timestamp)) {
          rawValue.value = transformedValue;
          rawValue.timestamp = timestamp;
          rawValue.tombstone = false;
          onChange();
        }
      } else {
        const rawValue: ArrayValue = {
          value: transformedValue,
          timestamp: timestamp,
          isPrimitive: isPrimitiveType(value) || false,
          key: key,
          tombstone: false,
        };

        /**
         * Find index to insert into.
         * Move the other elements by 1
         */

        const insertIndex: number = findIndexToInsert(key.toString());

        if (insertIndex >= _array.length) {
          _array[insertIndex] = rawValue;
          onChange();
        } else {
          /**
           * Move all elements after index
           */
          const spliced = _array.splice(insertIndex, _array.length);
          _array.push(rawValue);
          _array.push(...spliced);
          onChange();
        }

        /**
         * this is a new crdt index,
         * define index property for get
         */
        defineIndexProperty(key.toString());

        /**
         * insert index is already defined, i.e.,
         * existing index. We have to add a new index for the last
         * element of the array
         */
        defineIndexProperty(_array.length - 1);
      }
    },
  });

  // Object.defineProperty(_self, "insert", {
  //   configurable: false,
  //   enumerable: false,
  //   writable: false,
  //   value: function (index: number, value: any) {
  //     let elementBefore: ArrayValue;
  //     let elementAfter: ArrayValue;

  //     if (index === 0 || _array.length === 0) {
  //       elementBefore = {
  //         key: Key.generateString("", MIN_ARR_VALUE),
  //         value: null,
  //       };
  //     } else {
  //       elementBefore =
  //     }
  //   },
  // });

  function raiseEvent(event: TEvent) {
    /**
     * generate a patch based on the event type and call
     * onChange with the patch
     *
     * event path should always be a crdt key rather than
     * blank index
     */

    if (event.type === "itemchanged") {
      const patch: TPatch = {
        op: "replace",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      // const modPath = convertIndexedToCrdtPath(_self, patch);
      // patch.path = modPath;
      emitPatch(patch);
      onChange(patch);
    }
    if (event.type === "itemadded") {
      const patch: TPatch = {
        op: "add",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      // const modPath = convertIndexedToCrdtPath(_self, patch);
      // patch.path = modPath;
      emitPatch(patch);
      onChange(patch);
    }
    if (event.type === "itemdeleted") {
      const patch: TPatch = {
        op: "remove",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      // const modPath = convertIndexedToCrdtPath(_self, patch);
      // patch.path = modPath;
      emitPatch(patch);
      onChange(patch);
    }
  }

  function crdtIndexToArrayIndex(crdtIndex: string) {
    let index: number = -1;
    for (let i = 0; i < _array.length; i++) {
      if (_array[i].key.toString() === Key.fromString(crdtIndex).toString()) {
        index = i;
      }
    }
    return index;
  }

  Object.defineProperty(_self, "crdtIndexToArrayIndex", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (key: string) {
      return crdtIndexToArrayIndex(key);
    },
  });

  function findIndexToInsert(key: Key | string): number {
    /**
     * We need to find an index where this key
     * is > previousKey and < nextKey.
     * Since we assume that the _array is sorted with
     * key, we can find only index where key becomes > nextKey
     * and set that index
     */

    if (_array.length === 0) {
      return 0;
    }

    let index = -1;
    const compareKey = key instanceof Key ? key : Key.fromString(key);

    for (let i = 0; i < _array.length; i++) {
      const key = _array[i].key;
      if (key.lessThan(compareKey)) {
        index = i;
      }
    }

    return index + 1;
  }

  Object.defineProperty(_self, "findIndexToInsert", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (key: string) {
      return findIndexToInsert(key);
    },
  });

  Object.defineProperty(_self, "applyPatch", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (patch) {
      /**
       * patch will be of the form
       *
       * op: "add" | "remove" | "insert" | "replace"
       * path: "/abcde$0.45"
       * value: 10
       * lamportTimestamp: 10
       *
       * In case of each operation,
       * we have to find the index where the path fits,
       * transpose, i.e., change the path to mean that index
       * and apply the patch
       *
       * Path may contain multiple keys where the path
       * is a CRDT key, we have to find each key and if
       * it is a CRDT key, find the index where the op
       * is to be applied and transpose
       *
       *
       */

      // console.log("[array:applyPatch]", patch);

      const res = apply(_self, patch);

      // console.log("[patch:res]", _array);

      /**
       * if it an add or remove operation
       * assign index property
       */
      // if (res.length > 0) {
      //   if (res[0]) {
      //     defineIndexProperty(res[0]);
      //   }
      // }
    },
  });

  /**
   * this is for the user to delete a value
   * @param index the array index to delete
   */
  function deleteValue(index: number) {
    /**
     * delete is not straightforward.
     * we will have to find what index corresponds to the
     * non tombstoned value for this array
     */

    // for (let i = index; i < _array.length; i++) {
    //   const rawValue = _array[i];
    //   if (!rawValue.tombstone) {
    //     index = i;
    //     return;
    //   }
    // }

    const rawValue: ArrayValue | undefined = getElementAtIndex(index);
    console.log("[deletevalue]", rawValue);
    if (rawValue) {
      rawValue.tombstone = true;
      rawValue.timestamp.increment();
      raiseEvent({
        path: "/" + rawValue.key.toString(),
        timestamp: rawValue.timestamp.timestamp,
        type: "itemdeleted",
      });
    }
  }

  Object.defineProperty(_self, "delete", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (index: number) {
      deleteValue(index);
    },
  });

  Object.defineProperty(_self, "deleteValueFromPatch", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (
      crdtIndex: string,
      value: any,
      timestampValue: TimestampValue
    ) {
      if (!Key.isCrdtKey(crdtIndex.toString())) {
        throw new Error("Only CRDT keys can be used to apply patch on array.");
      }

      let timestamp = new Timestamp(timestampValue.actorId, timestampValue.seq);

      const arrayIndex = crdtIndexToArrayIndex(crdtIndex);

      console.log(
        "[deletevaluefrompatch]",
        arrayIndex,
        _array[arrayIndex],
        crdtIndex
      );

      if (arrayIndex !== -1) {
        const rawValue: ArrayValue = _array[arrayIndex];

        /**
         * We check if my timestamp is lower than yours,
         * then I will update my timestamp to match yours.
         * This will ensure that if multiple users delete
         * a value at the same time, the timestamps will
         * still be in sync
         */

        if (rawValue.timestamp.lessThan(timestamp)) {
          rawValue.timestamp = timestamp;
        }

        _array[arrayIndex].tombstone = true;

        onChange();
      }
    },
  });

  Object.defineProperty(_self, "addEventListener", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (eventName, handler) {
      eventName = ("" + eventName).toLowerCase();
      if (!(eventName in _handlers)) throw new Error("Invalid event name.");
      if (typeof handler !== "function") throw new Error("Invalid handler.");
      _handlers[eventName].push(handler);
    },
  });

  Object.defineProperty(_self, "removeEventListener", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (eventName, handler) {
      eventName = ("" + eventName).toLowerCase();
      if (!(eventName in _handlers)) throw new Error("Invalid event name.");
      if (typeof handler !== "function") throw new Error("Invalid handler.");
      var h = _handlers[eventName];
      var ln = h.length;
      while (--ln >= 0) {
        if (h[ln] === handler) {
          h.splice(ln, 1);
        }
      }
    },
  });

  Object.defineProperty(_self, "push", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function () {
      var index;

      console.log("[push]", arguments);

      for (var i = 0; i < arguments.length; i++) {
        /**
         * calculate key index
         */

        const timestamp = new Timestamp(_actorId);
        let newKey: Key;

        if (_array.length > 0) {
          const lastKey = _array[_array.length - 1].key;
          console.log("[push:existing]:lastkey", _array.length, lastKey);
          newKey = Key.generateNextFromString(lastKey.toString());
          console.log("[push:existing]:newkey", _array.length, newKey);
          const valueToSet = getValueToSet(newKey.toString(), arguments[i]);
          const value: ArrayValue = {
            key: newKey,
            value: valueToSet,
            isPrimitive: isPrimitiveType(arguments[i]) || false,
            timestamp,
            tombstone: false,
          };
          _array.push(value);
        } else {
          newKey = new Key(MIN_ARR_VALUE.toString());
          console.log("[push:new]", _array.length, newKey);
          const valueToSet = getValueToSet(newKey.toString(), arguments[i]);
          const value: ArrayValue = {
            key: newKey,
            value: valueToSet,
            isPrimitive: isPrimitiveType(arguments[i]) || false,
            timestamp,
            tombstone: false,
          };
          _array.push(value);
        }

        index = _array.length - 1;
        defineIndexProperty(newKey.toString());
        defineIndexProperty(index);
        raiseEvent({
          type: "itemadded",
          // index: newKey,
          // item: arguments[i],
          // TODO: do we need to convert this to
          // array Key string?
          path: "/" + newKey.toString(),
          timestamp: timestamp.timestamp,
          value: arguments[i],
        });
      }
      return _array.length;
    },
  });

  // Object.defineProperty(_self, "pop", {
  //   configurable: false,
  //   enumerable: false,
  //   writable: false,
  //   value: function () {
  //     if (_array.length > -1) {
  //       var index = _array.length - 1,
  //         item = _array.pop();
  //       delete _self[index];
  //       raiseEvent({
  //         type: "itemdeleted",
  //         index: index,
  //         item: item,
  //       });
  //       return item;
  //     }
  //   },
  // });

  // Object.defineProperty(_self, "unshift", {
  //   configurable: false,
  //   enumerable: false,
  //   writable: false,
  //   value: function () {
  //     for (var i = 0, ln = arguments.length; i < ln; i++) {
  //       _array.splice(i, 0, arguments[i]);
  //       defineIndexProperty(_array.length - 1);
  //       raiseEvent({
  //         type: "itemadded",
  //         index: i,
  //         item: arguments[i],
  //       });
  //     }
  //     for (; i < _array.length; i++) {
  //       raiseEvent({
  //         type: "itemset",
  //         index: i,
  //         item: _array[i],
  //       });
  //     }
  //     return _array.length;
  //   },
  // });

  // Object.defineProperty(_self, "shift", {
  //   configurable: false,
  //   enumerable: false,
  //   writable: false,
  //   value: function () {
  //     if (_array.length > -1) {
  //       var item = _array.shift();
  //       delete _self[_array.length];
  //       raiseEvent({
  //         type: "itemdeleted",
  //         index: 0,
  //         item: item,
  //       });
  //       return item;
  //     }
  //   },
  // });

  // Object.defineProperty(_self, "splice", {
  //   configurable: false,
  //   enumerable: false,
  //   writable: false,
  //   value: function (index, howMany /*, element1, element2, ... */) {
  //     var removed: any[] = [],
  //       item,
  //       pos;

  //     index = index == null ? 0 : index < 0 ? _array.length + index : index;

  //     howMany =
  //       howMany == null ? _array.length - index : howMany > 0 ? howMany : 0;

  //     while (howMany--) {
  //       item = _array.splice(index, 1)[0];
  //       removed.push(item);
  //       delete _self[_array.length];
  //       raiseEvent({
  //         type: "itemdeleted",
  //         index: index + removed.length - 1,
  //         item: item,
  //       });
  //     }

  //     for (var i = 2, ln = arguments.length; i < ln; i++) {
  //       _array.splice(index, 0, arguments[i]);
  //       defineIndexProperty(_array.length - 1);
  //       raiseEvent({
  //         type: "itemadded",
  //         index: index,
  //         item: arguments[i],
  //       });
  //       index++;
  //     }

  //     return removed;
  //   },
  // });

  Object.defineProperty(_self, "indexOf", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (checkFunction: (value: any) => boolean) {
      let index = -1;
      for (let i = 0; i < _array.length; i++) {
        const rawValue: ArrayValue = _array[i];
        if (rawValue.tombstone) {
          continue;
        }
        index++;
        if (checkFunction(rawValue.value)) {
          return index;
        }
      }
      return index;
    },
  });

  Object.defineProperty(_self, "length", {
    configurable: false,
    enumerable: false,
    get: function () {
      return _array.filter((value: ArrayValue) => !value.tombstone).length;
    },
  });

  Object.defineProperty(_self, "rawLength", {
    configurable: false,
    enumerable: false,
    get: function () {
      return _array.length;
    },
  });

  Object.defineProperty(_self, "map", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: _array
      .filter((rawValue: ArrayValue) => !rawValue.tombstone)
      .map((rawValue: ArrayValue) => rawValue.value).map,
  });

  // Object.getOwnPropertyNames(Array.prototype).forEach(function (name) {
  //   if (!(name in _self)) {
  //     Object.defineProperty(_self, name, {
  //       configurable: false,
  //       enumerable: false,
  //       writable: false,
  //       value: Array.prototype[name],
  //     });
  //   }
  // });

  function handleNonPrimitiveChildChange(childName) {
    return (patch) => {
      patch.path = `/${childName}${patch.path}`;
      emitPatch(patch);
    };
  }

  function getValueToSet(key: string, value: TSimpleValue) {
    const type = typeof value;
    if (isPrimitiveType(type)) {
      return value;
    } else if (isArrayType(value)) {
      // return new ObservableArray(
      //   value,
      //   handleNonPrimitiveChildChange(key),
      //   _actorId,
      //   onSet
      // );
      return new ObservableArray({
        items: value,
        emitPatch: handleNonPrimitiveChildChange(key),
        actorId,
        collectionName,
        onChange,
      });
    } else if (type === "object" && value !== null) {
      // return new ObservableObject(
      //   value,
      //   handleNonPrimitiveChildChange(key),
      //   actorId,
      //   onSet
      // );
      return new ObservableObject({
        actorId,
        collectionName,
        object: value,
        emitPatch: handleNonPrimitiveChildChange(key),
        onChange,
      });
    } else {
      console.log(`We do not support ${type} yet.`);
    }
  }

  if (items instanceof Array) {
    /**
     * calculate index values
     */

    // const step = MAX_ARR_INIT_VALUE / items.length;

    for (let i = 0; i < items.length; i++) {
      let item: any = items[i];
      /**
       * on initial load, we don't want actor id to be in the key
       * to prevent problems during initial load sync
       */
      let key = new Key((KEY_DELTA * i).toString());

      const valueToSet = getValueToSet(key.toString(), item);

      const arrayItem: ArrayValue = {
        key,
        value: valueToSet,
        isPrimitive: isPrimitiveType(arguments[i]) || false,
        timestamp: new Timestamp(),
        tombstone: false,
      };
      _array.push(arrayItem);
      defineIndexProperty(i);
      defineIndexProperty(key.toString());
    }
  }
}
