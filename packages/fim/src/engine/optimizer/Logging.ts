// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/**
 * Returns the class name of an object as a string
 * @param object Any object
 * @return String containing the class name
 */
export function getClassName(object: any): string {
  return object.constructor.name;
}

/**
 * Convert a number of bytes to a string
 * @param bytes Bytes, expressed as a `number` type
 * @return String containing the value, in megabytes
 */
export function memoryToString(bytes: number): string {
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  return `${mb} MB`;
}
