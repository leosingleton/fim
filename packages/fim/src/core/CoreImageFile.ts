// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas2D } from './CoreCanvas2D';
import { CoreMimeType } from './CoreMimeType';
import { ImageSource } from './types/ImageSource';

/** Helper functions to import and export PNG and JPEG image files */
export interface CoreImageFile {
  /**
   * Loads a file's contents onto an `ImageSource` instance which can then be loaded onto a canvas
   * @param file Image file, as a Uint8Array
   * @param type Mime type of the image file to load
   * @param callback Callback to execute once the image contents are loaded
   */
  loadFromFileAsync(file: Uint8Array, type: CoreMimeType, callback: (image: ImageSource) => void): Promise<void>;

  /**
   * Exports a canvas contents to an image file
   * @param canvas Canvas to export
   * @param type Mime type of the image file to export
   * @param quality Optional compression quality (0.0 to 1.0)
   * @returns Image file as a Uint8Array
   */
  exportToFileAsync(canvas: CoreCanvas2D, type: CoreMimeType, quality?: number): Promise<Uint8Array>;
}
