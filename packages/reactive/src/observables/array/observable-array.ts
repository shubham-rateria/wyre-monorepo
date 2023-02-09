import isArrayType from "../../helpers/isArrayType";
import isPrimitiveType from "../../helpers/isPrimitiveType";
import { Timestamp, TimestampValue } from "../../lamport/index";
import { TPatch } from "../../types/patch.type";
import { ObservableObject } from "../object/observable-object";
import { ArraySerializedValue } from "../utils/serialize";
import { Key } from "./key/key";
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

export default function ObservableArray(items, onChange, actorId = "") {
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

  function defineIndexProperty(index: string | number) {
    Object.defineProperty(_self, index, {
      configurable: true,
      enumerable: true,
      get: function () {
        if (Key.isCrdtKey(index.toString())) {
          index = _self.findIndex(index);
          if (index === -1) {
            /**
             * TODO: what to do when an unknown CRDT index
             * arrives?
             */
            console.error("Invalid CRDT index");
            return undefined;
          }
        }

        /**
         * If we are querying by array index,
         * the value at index might be tombstoned.
         * To take care of this case, we have to find
         * the next non-tombstoned value to send
         */
        console.log("[arr:get]", index, _array[index]);

        for (let i = parseInt(index.toString()); i < _array.length; i++) {
          const rawValue = _array[i];
          if (!rawValue.tombstone) {
            return rawValue.value;
          }
        }

        return undefined;
      },
      set: function (v) {
        /**
         * index may or may not be in the array
         */

        /**
         * we have to check if the index is a crdt key
         * or not and process accordingly
         */

        _array[index].timestamp.increment();
        _array[index].timestamp.timestamp.actorId = _actorId;
        _array[index].value = v;
        raiseEvent({
          type: "itemchanged",
          path: "/" + index,
          timestamp: _array[index].timestamp.timestamp,
          value: v,
        });
      },
    });
  }

  function setRawValues(values: ArraySerializedValue[]) {
    for (let i = 0; i < values.length; i++) {
      const item = values[i];
      const key = new Key(item.key.fractionalId.toString());
      const timestamp = new Timestamp(
        item.timestamp.timestamp.actorId,
        item.timestamp.timestamp.seq
      );
      if (
        typeof item.value === "object" &&
        !Array.isArray(item.value) &&
        item.value !== null &&
        !item.isSerialized
      ) {
        const newItem = new ObservableObject(
          {},
          handleNonPrimitiveChildChange(key.toString())
        );
        newItem.setRawValues(item.value);
        item.value = newItem;
      } else if (Array.isArray(item.value)) {
        const newItem = new ObservableArray(
          [],
          handleNonPrimitiveChildChange(key.toString())
        );
        newItem.setRawValues(item.value);
        item.value = newItem;
      }
      item.timestamp = timestamp;
      item.key = key;
      _array.push(item);
      defineIndexProperty(i);
      defineIndexProperty(key.toString());
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

  Object.defineProperty(_self, "setValueFromPatch", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (
      index: number | string,
      value: any,
      timestampValue: TimestampValue
    ) {
      if (!Key.isCrdtKey(index.toString())) {
        throw new Error("Only CRDT keys can be used to apply patch on array.");
      }

      const timestamp = new Timestamp(
        timestampValue.actorId,
        timestampValue.seq
      );

      index = _self.findIndex(index);

      const rawValue: ArrayValue = _array[index];

      if (canWrite(rawValue, timestamp) && !rawValue.tombstone) {
        _array[index].value = value;
        _array[index].timestamp = timestamp;
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

      if (_self.findIndex(crdtIndex) !== -1) {
        const changeIndex = _self.findIndex(crdtIndex);

        const rawValue = _array[changeIndex];
        console.log(
          "[settingvaluefromtpatch]",
          changeIndex,
          timestamp,
          rawValue
        );

        if (canWrite(rawValue, timestamp)) {
          console.log("[settingvaluefrompatch]", changeIndex, value);
          _array[changeIndex].value = value;
          _array[changeIndex].timestamp = timestamp;
          _array[changeIndex].tombstone = false;
        }
      } else {
        const rawValue: ArrayValue = {
          value: value,
          timestamp: timestamp,
          isPrimitive: isPrimitiveType(value) || false,
          key: Key.fromString(crdtIndex),
          tombstone: false,
        };

        /**
         * Find index to insert into.
         * Move the other elements by 1
         */

        const key = crdtIndex;
        const insertIndex: number = _self.getIndexFromCrdtKey(key);

        if (insertIndex >= _array.length) {
          _array[insertIndex] = rawValue;
        } else {
          /**
           * Move all elements after index
           */
          const spliced = _array.splice(insertIndex, _array.length);
          _array.push(rawValue);
          _array.concat(spliced);
        }

        /**
         * this is a new crdt index,
         * define index property for get
         */
        defineIndexProperty(crdtIndex);

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
      const modPath = convertIndexedToCrdtPath(_self, patch);
      patch.path = modPath;
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
      const modPath = convertIndexedToCrdtPath(_self, patch);
      patch.path = modPath;
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
      const modPath = convertIndexedToCrdtPath(_self, patch);
      patch.path = modPath;
      onChange(patch);
    }

    _handlers[event.type].forEach(function (h) {
      h.call(_self, event);
    });
  }

  Object.defineProperty(_self, "findIndex", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (key: string) {
      let index: number = -1;
      for (let i = 0; i < _array.length; i++) {
        console.log(
          "[findIndex]",
          _array[i].key.toString() === Key.fromString(key).toString()
        );
        if (_array[i].key.toString() === Key.fromString(key).toString()) {
          index = i;
        }
      }
      return index;
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

    let index = 0;
    const compareKey = key instanceof Key ? key : Key.fromString(key);

    for (let i = 0; i < _array.length; i++) {
      const key = _array[i].key;
      if (key.lessThan(compareKey)) {
        index = i;
      }
    }

    return index + 1;
  }

  Object.defineProperty(_self, "getIndexFromCrdtKey", {
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

      console.log("[array:applyPatch]", patch);

      const res = apply(_self, patch);

      console.log("[patch:res]", _array);

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
    const rawValue = _array[index];
    if (rawValue) {
      rawValue.tombstone = true;
      rawValue.timestamp.increment();
      raiseEvent({
        path: "/" + index,
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
      index: number | string,
      value: any,
      timestampValue: TimestampValue
    ) {
      if (!Key.isCrdtKey(index.toString())) {
        throw new Error("Only CRDT keys can be used to apply patch on array.");
      }

      const timestamp = new Timestamp(
        timestampValue.actorId,
        timestampValue.seq
      );

      const arrayIndex = _self.findIndex(index);
      if (arrayIndex !== -1) {
        const rawValue: ArrayValue = _array[arrayIndex];
        if (canWrite(rawValue, timestamp)) {
          _array[arrayIndex].tombstone = true;
          _array[arrayIndex].timestamp = timestamp;
        }
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
          path: "/" + index,
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

  Object.defineProperty(_self, "length", {
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
      onChange(patch);
    };
  }

  function getValueToSet(key: string, value: TSimpleValue) {
    const type = typeof value;
    if (isPrimitiveType(type)) {
      return value;
    } else if (isArrayType(value)) {
      return new ObservableArray(value, handleNonPrimitiveChildChange(key));
    } else if (type === "object" && value !== null) {
      return new ObservableObject(value, handleNonPrimitiveChildChange(key));
    } else {
      console.log(`We do not support ${type} yet.`);
    }
  }

  if (items instanceof Array) {
    /**
     * calculate index values
     */

    const step = MAX_ARR_INIT_VALUE / items.length;

    for (let i = 0; i < items.length; i++) {
      let item: any = items[i];
      /**
       * on initial load, we don't want actor id to be in the key
       * to prevent problems during initial load sync
       */
      let key = new Key((step * i).toString());

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
