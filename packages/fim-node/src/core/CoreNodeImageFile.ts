// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreNodeCanvas2D } from './CoreNodeCanvas2D';
import { CoreImageFile, CoreMimeType, ImageSource } from '@leosingleton/fim/internals';
import { Image } from 'canvas';
import { FimError } from '@leosingleton/fim';

/** Implementation of `CoreImageFile` for `CoreNodeCanvas2D` */
export class CoreNodeImageFile implements CoreImageFile {
  /** Use the global static instance */
  protected constructor() {}

  public loadFromFileAsync(file: Uint8Array, _type: CoreMimeType, callback: (image: ImageSource) => void):
      Promise<void> {
    return loadFromFileAsync(file, callback);
  }

  public async exportToFileAsync(canvas: CoreNodeCanvas2D, type: CoreMimeType, quality?: number): Promise<Uint8Array> {
    let buffer: Buffer;
    switch (type) {
      case CoreMimeType.JPEG:
        buffer = canvas.canvasElement.toBuffer(CoreMimeType.JPEG, { quality });
        break;

      case CoreMimeType.PNG:
        buffer = canvas.canvasElement.toBuffer(CoreMimeType.PNG);
        break;

      default:
        FimError.throwOnUnreachableCodeValue(type);
    }

    return new Uint8Array(buffer);
  }

  /** Shared global instance */
  public static readonly instance = new CoreNodeImageFile();
}

/**
 * Loads a file's contents onto an `ImageSource` instance which can then be loaded onto a canvas
 * @param file Image file, as a Uint8Array
 * @param callback Callback to execute once the image contents are loaded
 */
export function loadFromFileAsync(file: Uint8Array, callback: (image: ImageSource) => void): Promise<void> {
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
