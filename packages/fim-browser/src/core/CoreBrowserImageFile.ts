// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserCanvas2D } from './CoreBrowserCanvas2D';
import { CoreImageFile, CoreMimeType, ImageSource } from '@leosingleton/fim/internals';

/**
 * Helper functions to import and export PNG and JPEG image files
 * @template TBrowserCanvas2D Type of `CoreBrowserCanvas2D` supported by this implementation
 */
export abstract class CoreBrowserImageFile implements CoreImageFile {
  /** Derived classes should create a global static instance */
  protected constructor() {}

  public loadFromFileAsync(file: Uint8Array, type: CoreMimeType, callback: (image: ImageSource) => void):
      Promise<void> {
    return loadFromFileAsync(file, type, callback);
  }

  public async exportToFileAsync(canvas: CoreBrowserCanvas2D, type: CoreMimeType, quality?: number):
      Promise<Uint8Array> {
    const blob = await this.convertToBlobAsync(canvas, type, quality);
    const buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Converts a canvas to a `Blob`
   * @param canvas Canvas to convert to a `Blob`
   * @param type Mime type of the `Blob`
   * @param quality Optional compression quality (0.0 to 1.0)
   * @returns `Blob`
   */
  protected abstract convertToBlobAsync(canvas: CoreBrowserCanvas2D, type: CoreMimeType, quality?: number):
    Promise<Blob>;
}

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
