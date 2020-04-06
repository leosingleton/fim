// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreMimeType, ImageSource } from '@leosingleton/fim/internals';

/**
 * Loads a file's contents onto an `ImageSource` instance which can then be loaded onto a canvas
 * @param file Image file, as a Uint8Array
 * @param type Mime type of the image file to load
 * @param callback Callback to execute once the image contents are loaded
 */
export function loadFromFileAsync(file: Uint8Array, type: CoreMimeType, callback: (image: ImageSource) => void):
    Promise<void> {
  // Create a Blob holding the binary data and load it onto an HTMLImageElement
  const blob = new Blob([file], { type });

  return new Promise((resolve, reject) => {
    const url = (URL || webkitURL).createObjectURL(blob);
    const img = new Image();
    img.src = url;

    // On success, copy the image to a FimCanvas and return it via the Promise
    img.onload = async () => {
      try {
        await callback(img);
        resolve();
      } catch (err) {
        // The call to createCanvas() or createDrawingContext() could fail if we run out of memory
        reject(err);
      } finally {
        (URL || webkitURL).revokeObjectURL(url);
      }
    };

    // On error, return an exception via the Promise
    img.onerror = err => {
      (URL || webkitURL).revokeObjectURL(url);
      reject(err);
    };
  });
}
