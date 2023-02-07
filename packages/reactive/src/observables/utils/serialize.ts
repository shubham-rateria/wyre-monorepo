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
export function serializeArray(arr: typeof ObservableArray) {
  const serializedValue: ArraySerializedValue[] = [];
  // @ts-ignore
  for (let i = 0; i < arr.length; i++) {
    // @ts-ignore
    const arrRawValue: ArraySerializedValue = arr.getRawValue(i);
    if (arrRawValue.value instanceof ObservableObject) {
      // @ts-ignore
      arrRawValue.value = serializeObject(arrRawValue.value);
    } else if (arrRawValue.value instanceof ObservableArray) {
      // @ts-ignore
      arrRawValue.value = serializeArray(arrRawValue.value);
    } else {
      arrRawValue.isSerialized = true;
    }
    serializedValue.push(arrRawValue);
  }

  return serializedValue;
}

export function serializeObject(object: typeof ObservableObject) {
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
    if (rawValue.value instanceof ObservableArray) {
      // @ts-ignore
      rawValue.value = serializeArray(rawValue.value);
    } else if (rawValue.value instanceof ObservableObject) {
      // @ts-ignore
      rawValue.value = serializeObject(rawValue.value);
    } else {
      rawValue.isSerialized = true;
    }
    serializedValue[key] = rawValue;
  });

  return serializedValue;
}
