import isArrayType from "../../helpers/isArrayType";
import isPrimitiveType from "../../helpers/isPrimitiveType";
import { Timestamp, TimestampValue } from "../../lamport";
import { TPatch } from "../../types/patch.type";
import { TValue } from "../../types/value.type";
import ObservableArray from "../array/observable-array";
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
export default function ObservableObject(
  object,
  onChange,
  actorId: string = ""
) {
  var _self = this,
    _object: { [key: string]: TValue } = {},
    _handlers = {
      itemchanged: [],
    },
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
      if (timestamp.lessThan(objectValue.timestamp)) {
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

    const value = _object[key];
    if (timestamp.lessThan(value.timestamp)) {
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

    _handlers[event.type]?.forEach(function (h) {
      h.call(_self, event);
    });
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
