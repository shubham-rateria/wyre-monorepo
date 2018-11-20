import isArrayType from "../../helpers/isArrayType";
import isPrimitiveType from "../../helpers/isPrimitiveType";
import { Timestamp, TimestampValue } from "../../lamport";
import { TPatch } from "../../types/patch.type";
import { TValue } from "../../types/value.type";
import ObservableArray from "../array/observable-array";
import filterObject from "../utils/filter-object";
import {
  ArraySerializedValue,
  ObjectSerializedValue,
} from "../utils/serialize";
import { objectToJSON } from "../utils/toJSON";
import { apply } from "./patch/patch";
import lodash from "lodash";

type TSimpleValue = number | string | null | undefined | object;

type TEvent = {
  type: "itemchanged" | "itemadded" | "itemdeleted";
  path: string;
  value?: TSimpleValue;
  timestamp: TimestampValue;
};

interface ObservableObjectParams {
  object: any;
  emitPatch: (patch: TPatch) => void;
  actorId: string;
  collectionName: string;

  /**
   * onChange will trigger when either I have changed a value,
   * or when another user has overwritten my value
   */
  onChange: (patch?: TPatch) => void;

  onLocalChange: () => void;
}

/**
 * ObservableObject
 * @param {Object} object - the object to observe
 * @param {(patch) => void} onChange - triggers when a change on the object happens
 */
export function ObservableObject({
  object,
  emitPatch,
  actorId,
  collectionName,
  onChange,
  onLocalChange,
}: ObservableObjectParams): void {
  var _self = this,
    _object: { [key: string]: TValue } = {},
    _actorId = actorId;

  function getValueToSet(key: string, value: TSimpleValue) {
    const type = typeof value;
    if (isPrimitiveType(type)) {
      return value;
    } else if (isArrayType(value)) {
      // return new ObservableArray(
      //   value,
      //   handleNonPrimitiveChildChange(key),
      //   actorId,
      //   onSet
      // );
      return new ObservableArray({
        actorId,
        collectionName,
        items: value,
        emitPatch: handleNonPrimitiveChildChange(key),
        onChange,
        onLocalChange,
      });
    } else if (type === "object" && value !== null) {
      return new ObservableObject({
        object: value,
        actorId,
        collectionName,
        emitPatch: handleNonPrimitiveChildChange(key),
        onChange,
        onLocalChange,
      });
    } else {
      console.log(`We do not support ${type} yet.`);
    }
  }

  function setKeyValueBySelf(key: string, value: TSimpleValue) {
    const transformedValue = getValueToSet(key, value);
    if (key in _object) {
      _object[key].timestamp.increment();
      _object[key].timestamp.timestamp.actorId = _actorId;
      _object[key].value = transformedValue;
      raiseEvent({
        path: "/" + key,
        type: "itemchanged",
        value,
        timestamp: _object[key].timestamp.timestamp,
      });
    } else {
      const timestamp = new Timestamp(_actorId);
      const objValue: TValue = {
        isPrimitive: isPrimitiveType(value) || false,
        timestamp: timestamp,
        tombstone: false,
        value: transformedValue,
      };
      _object[key] = objValue;

      defineKeyProperty(key);

      raiseEvent({
        path: "/" + key,
        value,
        type: "itemadded",
        timestamp: timestamp.timestamp,
      });
    }
  }

  function deleteKey(key: string) {
    if (key in _object) {
      _object[key].timestamp.increment();
      _object[key].timestamp.timestamp.actorId = _actorId;
      _object[key].tombstone = true;
      return true;
    }
  }

  Object.defineProperty(_self, "delete", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (key: string) {
      const keyPresent = deleteKey(key);
      if (keyPresent) {
        raiseEvent({
          type: "itemdeleted",
          path: "/" + key,
          timestamp: _object[key].timestamp.timestamp,
        });
      }
    },
  });

  function setRawValues(obj: {
    [key: string]: ObjectSerializedValue | ArraySerializedValue;
  }) {
    const serializedObject = lodash.cloneDeep(obj);
    console.log("[setrawvalues:object]", serializedObject);
    /**
     * Iterate over the keys and check values
     */
    Object.keys(serializedObject).forEach((key: string) => {
      const item = serializedObject[key];
      let valueToSet: any;
      let timestampToSet: Timestamp;
      const timestamp = new Timestamp(
        item.timestamp.timestamp.actorId,
        item.timestamp.timestamp.seq
      );
      timestampToSet = timestamp;
      console.log("[setrawvalues:object:1]", item, timestamp);

      if (Array.isArray(item.value)) {
        // const arr = new ObservableArray(
        //   [],
        //   handleNonPrimitiveChildChange(key),
        //   actorId,
        //   onSet
        // );
        const arr = new ObservableArray({
          actorId,
          collectionName,
          items: [],
          emitPatch: handleNonPrimitiveChildChange(key),
          onChange,
          onLocalChange,
        });
        arr.setRawValues(item.value);
        valueToSet = arr;
        console.log("[setrawvalues:object:setting array value]", arr);
      } else if (
        typeof item.value === "object" &&
        !Array.isArray(item.value) &&
        item.value !== null &&
        !item.isSerialized
      ) {
        // const obj = new ObservableObject(
        //   {},
        //   handleNonPrimitiveChildChange(key),
        //   actorId,
        //   onSet
        // );
        const obj = new ObservableObject({
          actorId,
          emitPatch: handleNonPrimitiveChildChange(key),
          collectionName,
          object: {},
          onChange,
          onLocalChange,
        });
        obj.setRawValues(item.value);
        valueToSet = obj;
        console.log("[setrawvalues:object:setting object value]", obj);
      } else {
        valueToSet = item.value;
      }

      /**
       * if the key exists, compare timestamps
       * and apply change
       */
      if (key in _object) {
        console.log("[setrawvalues:object:key in object]", key, _object);

        const rawValue: TValue = _object[key];
        console.log(
          "[setrawvalues:object:checking ts]",
          rawValue.timestamp,
          timestamp
        );

        if (rawValue.timestamp.lessThan(timestamp) && !rawValue.tombstone) {
          console.log("[setrawvalues:object:< ts]", item);
          _object[key] = {
            ...item,
            timestamp: timestamp,
            value: valueToSet,
          };
        }
      } else {
        console.log("[setrawvalues:object:key not in object]", item, key);
        _object[key] = {
          ...item,
          timestamp: timestampToSet,
          value: valueToSet,
        };
        defineKeyProperty(key);
      }
    });
  }

  Object.defineProperty(_self, "setRawValues", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (obj: {
      [key: string]: ObjectSerializedValue | ArraySerializedValue;
    }) {
      setRawValues(obj);
    },
  });

  function getRawValue(key: string) {
    return _object[key];
  }

  Object.defineProperty(_self, "getRawValue", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (key: string) {
      return getRawValue(key);
    },
  });

  function setKeyValueFromPatch(
    key: string,
    value: TSimpleValue,
    timestampValue: TimestampValue
  ) {
    /**
     * if the key is already present,
     * check if the timestamp received
     * is lesser, if yes, set the value
     * and replace the timestamp
     *
     * if key is not present, set the key with the
     * provided timestamp
     */

    /**
     * add can have these situations
     * 1. There is no key present with the specified key in operation
     * Straightforward set key
     *
     * 2. There is a key present with the specified key in operation, for example
     * when two users add the same key simultaneously. We can change the op to a replace
     * op if this is the case and proceed.
     *
     * 3. There is a tombstone key present with the specified key in operation, for example
     * when one user has removed the key while the other has changed some value for that
     * key. In this case, we can compare timestamps, and if the received timestamp is
     * greater, the object can be revived
     */
    const transformedValue = getValueToSet(key, value);
    const timestamp = new Timestamp(timestampValue.actorId, timestampValue.seq);

    if (key in _object) {
      const objectValue = _object[key];
      if (objectValue.timestamp.lessThan(timestamp) && !objectValue.tombstone) {
        _object[key].timestamp = timestamp;
        _object[key].value = transformedValue;
        _object[key].tombstone = false;
        _object[key].isPrimitive = isPrimitiveType(value) || false;
        onChange();
      }
    } else {
      const objValue: TValue = {
        isPrimitive: isPrimitiveType(value) || false,
        timestamp: timestamp,
        tombstone: false,
        value: transformedValue,
      };
      _object[key] = objValue;
      defineKeyProperty(key);
      onChange();
    }

    console.log(
      "[patch:object:setkeyvaluefrompatch]",
      _object[key],
      key,
      value,
      timestampValue
    );
  }

  function deleteKeyFromPatch(key: string, timestamp: Timestamp) {
    /**
     * we assume that message ordering will be
     * maintained, thus if a user adds a key then deletes is,
     * the add patch will reach me before the delete,
     * therefore a key SHOULD ALWAYS be present if a delete on the same
     * is done.
     *
     * what happens when two users delete the same object at the same time?
     * compare timestamps, and whichever is lower, apply that to the object
     */

    /**
     * TODO: Decide what to do if key is NOT present
     */

    const value = _object[key];

    console.log("[deletefrompatch]", value, key, timestamp);

    /**
     * We check if my timestamp is lower than yours,
     * then I will update my timestamp to match yours.
     * This will ensure that if multiple users delete
     * a value at the same time, the timestamps will
     * still be in sync. Since delete is sacrosant, we
     * delete value irrespective of my timestamp.
     */

    if (value.timestamp.lessThan(timestamp)) {
      value.timestamp = timestamp;
    }

    _object[key].tombstone = true;

    onChange();
  }

  Object.defineProperty(_self, "deleteKeyFromPatch", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (key: string, timestampValue: TimestampValue) {
      const timestamp = new Timestamp(
        timestampValue.actorId,
        timestampValue.seq
      );
      deleteKeyFromPatch(key, timestamp);
    },
  });

  function hasKey(key) {
    return key in _object;
  }

  Object.defineProperty(_self, "hasKey", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (key) {
      return hasKey(key);
    },
  });

  function defineKeyProperty(key) {
    Object.defineProperty(_self, key, {
      configurable: true,
      enumerable: true,
      get: function () {
        return !_object[key]?.tombstone ? _object[key].value : undefined;
      },
      set: function (v) {
        console.log("[object:set]", key, v);
        setKeyValueBySelf(key, v);
      },
    });
  }

  Object.defineProperty(_self, "getValueForPointer", {
    configurable: false,
    enumerable: false,
    value: function (key) {
      return _object[key].value;
    },
  });

  Object.defineProperty(_self, "setKeyValueFromPatch", {
    configurable: false,
    enumerable: false,
    value: function (key: string, value: any, timestampValue: TimestampValue) {
      setKeyValueFromPatch(key, value, timestampValue);
    },
  });

  // Object.defineProperty(_self, "addEventListener", {
  //   configurable: false,
  //   enumerable: false,
  //   writable: false,
  //   value: function (eventName, handler) {
  //     eventName = ("" + eventName).toLowerCase();
  //     if (!(eventName in _handlers)) throw new Error("Invalid event name.");
  //     if (typeof handler !== "function") throw new Error("Invalid handler.");
  //     _handlers[eventName].push(handler);
  //   },
  // });

  Object.defineProperty(_self, "applyPatch", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (patch: TPatch) {
      /**
       * when applying a patch on a path,
       * we need to compare timestamps of that path,
       * is the timestamp is lesser, apply the patch
       * and update the timestamp
       *
       * if the path end pointer parent is a non
       * primitive type, trigger and apply patch for that
       * type with the same timestamp propagated
       */

      apply(_self, patch);
    },
  });

  Object.defineProperty(_self, "keys", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
      const filteredObject = filterObject(
        _object,
        (value: TValue, key: string) => {
          return !value.tombstone;
        }
      );
      return Object.keys(filteredObject);
    },
  });

  Object.defineProperty(_self, "rawKeys", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () {
      return Object.keys(_object);
    },
  });

  function insertNewKey(key: string, value: any) {
    if (key in _object) {
      throw new Error("Key already exists.");
    }

    const transformedValue = getValueToSet(key, value);
    const timestamp = new Timestamp(_actorId);
    const rawValue: TValue = {
      isPrimitive: isPrimitiveType(value) || false,
      timestamp: timestamp,
      tombstone: false,
      value: transformedValue,
    };
    _object[key] = rawValue;
    defineKeyProperty(key);
    raiseEvent({
      type: "itemadded",
      path: "/" + key,
      value: value,
      timestamp: timestamp.timestamp,
    });
  }

  Object.defineProperty(_self, "insert", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (key: string, value: any) {
      return insertNewKey(key, value);
    },
  });

  Object.defineProperty(_self, "toJSON", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function () {
      return objectToJSON(_self);
    },
  });

  function raiseEvent(event: TEvent) {
    /**
     * generate a patch based on the event type and call
     * onChange with the patch
     */
    if (event.type === "itemchanged") {
      const patch: TPatch = {
        op: "replace",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      emitPatch(patch);
      onLocalChange();
    }

    if (event.type === "itemadded") {
      const patch: TPatch = {
        op: "add",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      emitPatch(patch);
      onLocalChange();
    }

    if (event.type === "itemdeleted") {
      const patch: TPatch = {
        op: "remove",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      emitPatch(patch);
      onLocalChange();
    }
  }

  function handleNonPrimitiveChildChange(childName) {
    return (patch) => {
      patch.path = `/${childName}${patch.path}`;
      emitPatch(patch);
    };
  }

  Object.keys(object).forEach((key) => {
    const transformedValue:
      | TSimpleValue
      | typeof ObservableArray
      | typeof ObservableObject = getValueToSet(key, object[key]);
    _object[key] = {
      isPrimitive: isPrimitiveType(object[key]) || false,
      /**
       * initial timestamps never specify the
       * actorid, since
       * 1. I have not made any changes to this, this
       * object has been given to me
       * 2. Everyone must start on the same timestamp when
       * initial data is given
       */
      timestamp: new Timestamp(),
      tombstone: false,
      value: transformedValue,
    };
    defineKeyProperty(key);
  });
}
