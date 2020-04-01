// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/**
 * Helper function to generate an image name from the URL or path of the image file
 * @param urlOrPath URL or path to a file
 * @returns String to be used as a default value for the image name
 */
export function fileToName(urlOrPath: string): string {
  // Return everything after the last slash or backslash. If neither exist, just return the original string.
  const lastSlash = urlOrPath.lastIndexOf('/') + 1;
  const lastBackslash = urlOrPath.lastIndexOf('\\') + 1;
  return urlOrPath.substring(Math.max(lastSlash, lastBackslash));
}
