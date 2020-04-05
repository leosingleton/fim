// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreMimeType } from './CoreMimeType';
import { ImageSource } from './types/ImageSource';

/**
 * Loads a file's contents onto an `ImageSource` instance which can then be loaded onto a canvas
 * @param file Image file, as a Uint8Array
 * @param type Mime type of the image file to load
 * @param callback Callback to execute once the image contents are loaded
 */
export type CoreImageLoader = (file: Uint8Array, type: CoreMimeType, callback: (image: ImageSource) => void)
  => Promise<void>;
