// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas2D, CoreMimeType } from '@leosingleton/fim/internals';

/**
 * Helper function to load an image from a file onto a `CoreCanvas2D` using the browser's built-in Blob support
 * @param destCanvas Destination `CoreCanvas2D`
 * @param file Image file, as a Uint8Array
 * @param mimeType Mime type of the image file
 */
export function loadFromFileAsync(destCanvas: CoreCanvas2D, file: Uint8Array, mimeType: CoreMimeType): Promise<void> {
  // Create a Blob holding the binary data and load it onto an HTMLImageElement
  const blob = new Blob([file], { type: mimeType });

  return new Promise((resolve, reject) => {
    const url = (URL || webkitURL).createObjectURL(blob);
    const img = new Image();
    img.src = url;

    // On success, copy the image to a FimCanvas and return it via the Promise
    img.onload = () => {
      try {
        destCanvas.loadFromImage(img);
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
