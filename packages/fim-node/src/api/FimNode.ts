// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeImage } from './FimNodeImage';
import { FimBase, FimImageOptions, FimObject, FimShader } from '@leosingleton/fim';

/**
 * Implementation of the FIM library for running in Node.js. This object holds images, shaders, and operations used
 * to manipulate 2D images within JavaScript using WebGL.
 */
export interface FimNode extends FimBase<FimNodeImage, FimShader> {
  /**
   * Reads a PNG file from disk and creates a new image from it
   * @param pngPath Path to a PNG file
   * @param options Optional overrides to the image options from the parent Fim object
   * @param name Optional name specified when creating the object to help with debugging
   * @param parent Optional parent object. If unspecified, defaults to the root FIM instance.
   */
  createImageFromPngFileAsync(pngPath: string, options?: FimImageOptions, name?: string, parent?: FimObject):
    Promise<FimNodeImage>;

  /**
   * Reads a JEPG file from disk and creates a new image from it
   * @param jpegPath Path to a JPEG file
   * @param options Optional overrides to the image options from the parent Fim object
   * @param name Optional name specified when creating the object to help with debugging
   * @param parent Optional parent object. If unspecified, defaults to the root FIM instance.
   */
  createImageFromJpegFileAsync(jpegPath: string, options?: FimImageOptions, name?: string, parent?: FimObject):
    Promise<FimNodeImage>;
}
