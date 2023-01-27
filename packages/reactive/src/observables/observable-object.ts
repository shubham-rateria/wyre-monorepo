import isArrayType from "../helpers/isArrayType";
import isPrimitiveType from "../helpers/isPrimitiveType";
import ObservableArray from "./observable-array";
import { applyPatch } from "../rfc6902";

/**
 * ObservableObject
 * @param {Object} object - the object to observe
 * @param {(patch) => void} onChange - triggers when a change on the object happens
 */
export default function ObservableObject(object, onChange) {
  var _self = this,
    _object = {},
    _handlers = {
      itemchanged: [],
    };

  function defineKeyProperty(key) {
    Object.defineProperty(_self, key, {
      configurable: true,
      enumerable: true,
      get: function () {
        return _object[key];
      },
      set: function (v) {
        _object[key] = v;
        raiseEvent({
          type: "itemchanged",
          key,
          item: v,
        });
      },
    });
  }

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
      applyPatch(_object, [patch]);
    },
  });

  function raiseEvent(event) {
    /**
     * generate a patch based on the event type and call
     * onChange with the patch
     */
    if (event.type === "itemchanged") {
      const patch = {
        op: "replace",
        path: `/${event.key}`,
        value: event.item,
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
