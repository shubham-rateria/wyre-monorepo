import { applyPatch } from "../../rfc6902";
import ObservableObject from "../object/observable-object";
import { Key } from "./key/key";
import { Timestamp, TimestampValue } from "../../lamport/index";
import isPrimitiveType from "../../helpers/isPrimitiveType";
import { TPatch } from "../../types/patch.type";
import { apply } from "./patch/patch";

const MIN_ARR_VALUE = 0;
const MAX_ARR_INIT_VALUE = 0.9;
const MAX_ARR_VALUE = 1;

type ArrayValue = {
  key: Key;
  value: any;
  tombstone: boolean;
  timestamp: Timestamp;
  isPrimitive: boolean;
};

type TSimpleValue = number | string | null | undefined | object;

type TEventTypes = "itemchanged" | "itemadded" | "itemdeleted" | "iteminserted";

type TEvent = {
  type: TEventTypes;
  path: string;
  value?: TSimpleValue;
  timestamp: TimestampValue;
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

  function defineIndexProperty(index) {
    if (!(index in _self)) {
      Object.defineProperty(_self, index, {
        configurable: true,
        enumerable: true,
        get: function () {
          return _array[index].value;
        },
        set: function (v) {
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
  }

  Object.defineProperty(_self, "setValueFromPatch", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (
      index: number,
      value: any,
      timestampValue: TimestampValue
    ) {
      const timestamp = new Timestamp(
        timestampValue.actorId,
        timestampValue.seq
      );
      const rawValue = _array[index];

      console.log(
        "[settingvaluefromtpatch]",
        timestamp,
        rawValue,
        timestamp.lessThan(rawValue.timestamp)
      );

      if (timestamp.lessThan(rawValue.timestamp)) {
        _array[index].value = value;
        _array[index].timestamp = timestamp;
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
     */
    if (event.type === "itemchanged") {
      const patch: TPatch = {
        op: "replace",
        path: `/${event.path}`,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      onChange(patch);
    }
    if (event.type === "itemadded") {
      const patch = {
        op: "add",
        path: `/${event.path}`,
        value: event.value,
        actorId: event.timestamp.actorId,
        seq: event.timestamp.seq,
      };
      onChange(patch);
    }
    if (event.type === "itemdeleted") {
      const patch = {
        op: "remove",
        path: `/${event.path}`,
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

  Object.defineProperty(_self, "findIndex", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (key: string) {
      for (let i = 0; i < _array.length; i++) {
        if (_array[i].key.isEqual(Key.fromString(key))) {
          return i;
        }
      }
    },
  });

  Object.defineProperty(_self, "getIndexFromCrdtKey", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function (key: string) {
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
      const compareKey = Key.fromString(key);

      for (let i = 0; i < _array.length; i++) {
        const key = _array[i].key;
        if (key.lessThan(compareKey)) {
          index = i;
        }
      }

      return index + 1;
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
      for (var i = 0, ln = arguments.length; i < ln; i++) {
        /**
         * calculate key index
         */

        const timestamp = new Timestamp(_actorId);
        let newKey: Key;

        if (_array.length > 0) {
          const lastKey = _array.reverse()[0].key;
          newKey = Key.generateBetween(
            lastKey.toString(),
            new Key(MAX_ARR_VALUE.toString()).toString()
          );
          const value: ArrayValue = {
            key: newKey,
            value: arguments[i],
            isPrimitive: isPrimitiveType(arguments[i]) || false,
            timestamp,
            tombstone: false,
          };
          _array.push(value);
        } else {
          newKey = new Key(MIN_ARR_VALUE.toString());
          const value: ArrayValue = {
            key: newKey,
            value: arguments[i],
            isPrimitive: isPrimitiveType(arguments[i]) || false,
            timestamp,
            tombstone: false,
          };
          _array.push(value);
        }

        index = _array.length - 1;
        defineIndexProperty(index);
        raiseEvent({
          type: "itemadded",
          // index: newKey,
          // item: arguments[i],
          // TODO: do we need to convert this to
          // array Key string?
          path: "/" + i,
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

  // Object.defineProperty(_self, "map", {
  //   configurable: false,
  //   enumerable: false,
  //   writable: false,
  //   value: _array.map,
  // });

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

  if (items instanceof Array) {
    /**
     * calculate index values
     */

    const step = MAX_ARR_INIT_VALUE / (items.length - 1);

    for (let i = 0; i < items.length; i++) {
      let item: any = items[i];
      /**
       * on initial load, we don't want actor id to be in the key
       * to prevent problems during initial load sync
       */
      let key = new Key((step * i).toString());

      if (typeof item === "object" && !Array.isArray(item) && item !== null) {
        item = new ObservableObject(item, handleNonPrimitiveChildChange(key));
      } else if (Array.isArray(item)) {
        item = new ObservableArray(item, handleNonPrimitiveChildChange(key));
      }

      const arrayItem: ArrayValue = {
        key,
        value: item,
        isPrimitive: isPrimitiveType(arguments[i]) || false,
        timestamp: new Timestamp(),
        tombstone: false,
      };
      _array.push(arrayItem);
      defineIndexProperty(i);
    }
  }
}
