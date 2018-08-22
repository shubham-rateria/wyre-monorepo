import { TValue } from "../../types/value.type";
import { ObservableObject } from "../object/observable-object";
import ObservableArray, { ArrayValue } from "../array/observable-array";
/**
 * This function will create a serialized
 * document with values as raw values that
 * can be sent over the network
 */

export interface ArraySerializedValue extends ArrayValue {
  isSerialized: boolean;
}

export interface ObjectSerializedValue extends TValue {
  isSerialized: boolean;
}

/**
 * Serializes array value
 * @param arr array to serialize
 * @returns {ArraySerializedValue[]} serialized array value
 */
export function arrayToJSON(arr: typeof ObservableArray) {
  const serializedValue: ArraySerializedValue[] = [];
  let value: any;
  // @ts-ignore
  for (let i = 0; i < arr.length; i++) {
    // @ts-ignore
    const arrRawValue: ArraySerializedValue = arr.getRawValueAtArrayIndex(i);
    if (arrRawValue.value instanceof ObservableObject) {
      // @ts-ignore
      value = objectToJSON(arrRawValue.value);
    } else if (arrRawValue.value instanceof ObservableArray) {
      // @ts-ignore
      value = arrayToJSON(arrRawValue.value);
    } else {
      arrRawValue.isSerialized = true;
      value = arrRawValue.value;
    }
    serializedValue.push(value);
  }

  return serializedValue;
}

export function objectToJSON(object: typeof ObservableObject) {
  const serializedValue = {};

  /**
   * iterate over the keys and determine the type of value
   * if the value is a primitive type, get raw value and
   * add as value for key, else get raw representation
   */
  // @ts-ignore
  object.keys().forEach((key: string) => {
    // @ts-ignore
    const rawValue: ObjectSerializedValue = object.getRawValue(key);
    let value: any;
    if (rawValue.value instanceof ObservableArray) {
      // @ts-ignore
      value = arrayToJSON(rawValue.value);
    } else if (rawValue.value instanceof ObservableObject) {
      // @ts-ignore
      value = objectToJSON(rawValue.value);
    } else {
      rawValue.isSerialized = true;
      value = rawValue.value;
    }
    serializedValue[key] = value;
  });

  return serializedValue;
}
