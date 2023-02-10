import { cloneDeep } from "lodash";
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
import { apply } from "./patch/patch";

type TSimpleValue = number | string | null | undefined | object;

type TEvent = {
  type: "itemchanged" | "itemadded" | "itemdeleted";
  path: string;
  value?: TSimpleValue;
  timestamp: TimestampValue;
};

/**
 * ObservableObject
 * @param {Object} object - the object to observe
 * @param {(patch) => void} onChange - triggers when a change on the object happens
 */
export function ObservableObject(object, onChange, actorId: string = ""): void {
  var _self = this,
    _object: { [key: string]: TValue } = {},
    _actorId = actorId;

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
    }
  }

  Object.defineProperty(_self, "delete", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (key: string) {
      deleteKey(key);
      raiseEvent({
        type: "itemdeleted",
        path: "/" + key,
        timestamp: _object[key].timestamp.timestamp,
      });
    },
  });

  function setRawValues(obj: {
    [key: string]: ObjectSerializedValue | ArraySerializedValue;
  }) {
    const serializedObject = cloneDeep(obj);
    /**
     * Iterate over the keys and check values
     */
    Object.keys(serializedObject).forEach((key: string) => {
      const item = serializedObject[key];
      const timestamp = new Timestamp(
        item.timestamp.timestamp.actorId,
        item.timestamp.timestamp.seq
      );
      item.timestamp = timestamp;
      if (Array.isArray(item.value)) {
        const arr = new ObservableArray(
          [],
          handleNonPrimitiveChildChange(key),
          _actorId
        );
        arr.setRawValues(item.value);
        item.value = arr;
      } else if (
        typeof item.value === "object" &&
        !Array.isArray(item.value) &&
        item.value !== null &&
        !item.isSerialized
      ) {
        const obj = new ObservableObject(
          {},
          handleNonPrimitiveChildChange(key),
          _actorId
        );
        obj.setRawValues(item.value);
        item.value = obj;
      }
      _object[key] = item;
      defineKeyProperty(key);
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

    if (value.timestamp.lessThan(timestamp)) {
      _object[key].tombstone = true;
      _object[key].timestamp = timestamp;
    }
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

  function raiseEvent(event: TEvent) {
    /**
     * generate a patch based on the event type and call
     * onChange with the patch
     */
    if (event.type === "itemchanged") {
      const patch = {
        op: "replace",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      onChange(patch);
    }

    if (event.type === "itemadded") {
      const patch = {
        op: "add",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      onChange(patch);
    }

    if (event.type === "itemdeleted") {
      const patch = {
        op: "remove",
        path: event.path,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      onChange(patch);
    }
  }

  function handleNonPrimitiveChildChange(childName) {
    return (patch) => {
      patch.path = `/${childName}${patch.path}`;
      onChange(patch);
    };
  }

  Object.keys(object).forEach((key) => {
    const transformedValue:
      | TSimpleValue
      | typeof ObservableArray
      | typeof ObservableObject = getValueToSet(key, object[key]);
    _object[key] = {
      isPrimitive: isPrimitiveType(object[key]) || false,
      timestamp: new Timestamp(_actorId),
      tombstone: false,
      value: transformedValue,
    };
    defineKeyProperty(key);
  });
}
