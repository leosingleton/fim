// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas2D, CoreMimeType } from '@leosingleton/fim/internals';

/**
 * Helper function to load an image from a file onto a `CoreCanvas2D` using the browser's built-in Blob support
 * @param destCanvas Destination `CoreCanvas2D`
 * @param file Image file, as a Uint8Array
 * @param mimeType Mime type of the image file
 * @param allowRescale With the default value of `false`, then the dimensions of `file` must match the dimensions of
 *    `destCanvas`. Otherwise, if `allowRescale` is `true`, then the contents of `file` will be automatically rescaled
 *    to fit `destCanvas`.
 */
export function loadCanvasFromFileAsync(destCanvas: CoreCanvas2D, file: Uint8Array, mimeType: CoreMimeType,
    allowRescale: boolean): Promise<void> {
  return loadFromFileAsync(file, mimeType, async img => destCanvas.loadFromImage(img, allowRescale));
}

/**
 * Helper function to load an image from a file using the browser's built-in Blob support
 * @param file Image file, as a Uint8Array
 * @param mimeType Mime type of the image file
 * @param callback Callback to execute once the image is loaded
 */
export function loadFromFileAsync(file: Uint8Array, mimeType: CoreMimeType,
    callback: (img: HTMLImageElement) => Promise<void>): Promise<void> {
  // Create a Blob holding the binary data and load it onto an HTMLImageElement
  const blob = new Blob([file], { type: mimeType });

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
