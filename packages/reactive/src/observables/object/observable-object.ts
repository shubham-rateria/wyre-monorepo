import isArrayType from "../../helpers/isArrayType";
import isPrimitiveType from "../../helpers/isPrimitiveType";
import ObservableArray from "../array/observable-array";
import { applyPatch } from "../../rfc6902";
import { Timestamp, TimestampValue } from "../../lamport";
import { TValue } from "../../types/value.type";

type TEvent = {
  type: "itemchanged" | "itemadded";
  path: string;
  value: string;
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

  function setKeyValueBySelf(key: string, value) {
    if (key in _object) {
      _object[key].timestamp.increment();
      _object[key].timestamp.timestamp.actorId = _actorId;
      _object[key].value = value;
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
        value,
      };
      _object[key] = objValue;
      raiseEvent({
        path: "/" + key,
        value,
        type: "itemadded",
        timestamp: timestamp.timestamp,
      });
    }
  }

  function setKeyValueFromPatch(
    key: string,
    value: any,
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

    const timestamp = new Timestamp(timestampValue.actorId, timestampValue.seq);

    if (key in _object) {
      const value = _object[key];
      if (timestamp.lessThan(value.timestamp)) {
        _object[key].timestamp = timestamp;
        _object[key].value = value;
        _object[key].isPrimitive = isPrimitiveType(value) || false;
      }
    } else {
      const objValue: TValue = {
        isPrimitive: isPrimitiveType(value) || false,
        timestamp: timestamp,
        tombstone: false,
        value,
      };
      _object[key] = objValue;
    }
  }

  function defineKeyProperty(key) {
    Object.defineProperty(_self, key, {
      configurable: true,
      enumerable: true,
      get: function () {
        return _object[key].value;
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
      return _object[key];
    },
  });

  Object.defineProperty(_self, "setValueFromPatch", {
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
    value: function (patch) {
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

      applyPatch(_object, [patch]);
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

    _handlers[event.type].forEach(function (h) {
      h.call(_self, event);
    });
  }

  //   function handleArrayChange(type, index, item) {
  //     console.log("Array changed", type, index, item);
  //   }

  function handleNonPrimitiveChildChange(childName) {
    return (patch) => {
      patch.path = `/${childName}${patch.path}`;
      onChange(patch);
    };
  }

  Object.keys(object).forEach((key) => {
    /**
     * get type of value
     * if it a primitive,
     * assign as is,
     * if it is an array,
     * make it an observable array
     */

    const type = typeof object[key];

    if (isPrimitiveType(type)) {
      _object[key] = object[key];

      // TODO: create empty timestamp

      defineKeyProperty(key);
    } else if (isArrayType(object[key])) {
      _object[key] = new ObservableArray(
        object[key],
        handleNonPrimitiveChildChange(key)
      );
      defineKeyProperty(key);
    } else if (type === "object" && object[key] !== null) {
      _object[key] = new ObservableObject(
        object[key],
        handleNonPrimitiveChildChange(key)
      );
      defineKeyProperty(key);
    } else {
      console.log(`We do not support ${type} yet.`);
    }
  });
}
