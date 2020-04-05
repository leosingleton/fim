// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreMimeType, ImageSource } from '@leosingleton/fim/internals';
import { Image } from 'canvas';

/**
 * Loads a file's contents onto an `ImageSource` instance which can then be loaded onto a canvas
 * @param file Image file, as a Uint8Array
 * @param type Mime type of the image file to load
 * @param callback Callback to execute once the image contents are loaded
 */
export function loadFromFileAsync(file: Uint8Array, _type: CoreMimeType, callback: (image: ImageSource) => void):
    Promise<void> {
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
