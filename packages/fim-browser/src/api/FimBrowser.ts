// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImage } from './FimBrowserImage';
import { FimBase, FimImageOptions, FimObject, FimShader } from '@leosingleton/fim';

/**
 * Implementation of the FIM library for running in web browsers. This object holds images, shaders, and operations used
 * to manipulate 2D images within JavaScript using WebGL.
 */
export interface FimBrowser extends FimBase<FimBrowserImage, FimShader> {
  /**
   * Creates a new image from an image `Blob`
   * @param blob, Image file, as a `Blob`
   * @param options Optional overrides to the image options from the parent Fim object
   * @param name Optional name specified when creating the object to help with debugging
   * @param parent Optional parent object. If unspecified, defaults to the root FIM instance.
   */
  createImageFromBlobAsync(blob: Blob, options?: FimImageOptions, name?: string, parent?: FimObject):
    Promise<FimBrowserImage>;
}
