import { applyPatch } from "../../rfc6902";
import ObservableObject from "../object/observable-object";
import { Key } from "./key";

const MIN_ARR_VALUE = 0;
const MAX_ARR_INIT_VALUE = 0.9;
const MAX_ARR_VALUE = 1;

type ArrayValue = {
  key: string;
  value: any;
};

export default function ObservableArray(items, onChange, actorId = "") {
  var _self = this,
    /**
     * this will always be sorted according to the key value
     */
    _array: ArrayValue[] = [],
    _actorId: string = actorId,
    _handlers = {
      itemadded: [],
      itemremoved: [],
      itemset: [],
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
          _array[index].value = v;
          raiseEvent({
            type: "itemset",
            index: index,
            item: v,
          });
        },
      });
    }
  }

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

  function raiseEvent(event) {
    /**
     * generate a patch based on the event type and call
     * onChange with the patch
     */
    if (event.type === "itemset") {
      const patch = {
        op: "replace",
        path: `/${event.index}`,
        value: event.item,
      };
      onChange(patch);
    }
    if (event.type === "itemadded") {
      const patch = {
        op: "add",
        path: `/${event.index}`,
        value: event.item,
      };
      onChange(patch);
    }
    if (event.type === "itemremoved") {
      const patch = {
        op: "remove",
        path: `/${event.index}`,
        value: event.item,
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
        if (_array[i].key === key) {
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
        const key = Key.fromString(_array[i].key);
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

      let path = "";
      let parent: any = null;
      let key = "";
      let value = _self;
      const tokens = patch.path.split("/").filter((val) => val !== "");

      console.log("[applypatch]:tokens", tokens);

      for (const token of tokens) {
        console.log("[applypatch]:isKey", Key.isCrdtKey(token));

        if (!Key.isCrdtKey(token)) {
          console.log("[applypatch]:processingNonToken", token, value);

          path += "/" + token;
          parent = value;
          value = parent[key];
          continue;
        }

        console.log("[applypatch]:processingToken", token, value);

        /**
         * Find the index
         */

        let index: number;

        if (patch.op === "replace") {
          index = value.findIndex(token);
          if (!index) {
            throw new Error("could not find index" + token);
          }
        } else {
          index = value.getIndexFromCrdtKey(token);
        }

        console.log("[applypatch]:index", token, index);

        path += "/" + index.toString();

        /**
         * parent[index] in this case has to be a crdt array
         */
        parent = value;

        /**
         * in case of adding to the end,
         * the parent[index] will be undefined
         */
        if (parent[index]) {
          value = parent[index].value;
        }
      }

      patch.path = path;

      /**
       * Determine the last token
       * if it is a crdt array key,
       * the patch value needs to change to reflect ArrayValue
       */

      if (Key.isCrdtKey(tokens.reverse()[0])) {
        patch.value = {
          key: tokens.reverse()[0],
          value: patch.value,
        };
      }

      const res: any[] = applyPatch(_array, [patch]);

      console.log("[patch:res]", _array);

      /**
       * if it an add or remove operation
       * assign index property
       */
      if (res.length > 0) {
        if (res[0]) {
          defineIndexProperty(res[0]);
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
      for (var i = 0, ln = arguments.length; i < ln; i++) {
        /**
         * calculate key index
         */

        let newKey: string;

        if (_array.length > 0) {
          const lastKey = _array.reverse()[0].key;
          newKey = Key.generateBetween(
            _actorId,
            lastKey,
            Key.generateString(_actorId, MAX_ARR_VALUE)
          );
          const value: ArrayValue = {
            key: newKey,
            value: arguments[i],
          };
          _array.push(value);
        } else {
          newKey = Key.generateString(_actorId, 0);
          const value: ArrayValue = {
            key: newKey,
            value: arguments[i],
          };
          _array.push(value);
        }

        index = _array.length - 1;
        defineIndexProperty(index);
        raiseEvent({
          type: "itemadded",
          index: newKey,
          item: arguments[i],
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
  //         type: "itemremoved",
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
  //         type: "itemremoved",
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
  //         type: "itemremoved",
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

    const step = MAX_ARR_INIT_VALUE / items.length;

    for (let i = 0; i < items.length; i++) {
      let item: any = items[i];
      /**
       * on initial load, we don't want actor id to be in the key
       * to prevent problems during initial load sync
       */
      let key: string = Key.generateString("", step * i);

      if (typeof item === "object" && !Array.isArray(item) && item !== null) {
        item = new ObservableObject(item, handleNonPrimitiveChildChange(key));
      } else if (Array.isArray(item)) {
        item = new ObservableArray(item, handleNonPrimitiveChildChange(key));
      }

      const arrayItem: ArrayValue = {
        key,
        value: item,
      };
      _array.push(arrayItem);
      defineIndexProperty(i);
    }

    console.log(_array);
  }
}
