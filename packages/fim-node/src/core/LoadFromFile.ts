// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreNodeCanvas2D } from './CoreNodeCanvas2D';
import { Image } from 'canvas';

/**
 * Helper function to load an image from a file onto a `CoreCanvas2D` using the browser's built-in Blob support
 * @param destCanvas Destination `CoreCanvas2D`
 * @param file Image file, as a Uint8Array
 * @param allowRescale With the default value of `false`, then the dimensions of `file` must match the dimensions of
 *    `destCanvas`. Otherwise, if `allowRescale` is `true`, then the contents of `file` will be automatically rescaled
 *    to fit `destCanvas`.
 */
export function loadCanvasFromFileAsync(destCanvas: CoreNodeCanvas2D, file: Uint8Array, allowRescale: boolean):
    Promise<void> {
  return loadFromFileAsync(file, async img => destCanvas.loadFromImage(img, allowRescale));
}

/**
 * Helper function to load an image from a file using the browser's built-in Blob support
 * @param file Image file, as a Uint8Array
 * @param callback Callback to execute once the image is loaded
 */
export function loadFromFileAsync(file: Uint8Array, callback: (img: Image) => Promise<void>): Promise<void> {
  // Create a Buffer holding the binary data and load it onto an HTMLImageElement. Unlike the browser's Blob,
  // Node.js's Buffer doesn't care about mime types so accepts multiple file formats.
  const buffer = Buffer.from(file);

  return new Promise((resolve, reject) => {
    const img = new Image();

    // On success, copy the image to a FimCanvas and return it via the Promise
    img.onload = async () => {
      await callback(img);
      resolve();
    };

    // On error, return an exception via the Promise
    img.onerror = err => {
      reject(err);
    };

    img.src = buffer;
  });
}
