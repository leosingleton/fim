// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageOptions } from './FimImageOptions';
import { FimObject } from './FimObject';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';

/** Represents an image and its data within the FIM library */
export interface FimImage extends FimObject {
  /** Image dimensions */
  readonly imageDimensions: FimDimensions;

  /**
   * Image options
   *
   * Note that these properties are read/write. The application may attempt to change them after image creation,
   * however changes are not guaranteed to take effect immediately. Generally options take effect on the next method
   * call, however some require calling releaseResources() to recreate the back-end objects altogether.
   *
   * Also note that an undefined value here inherits the value from the parent FIM class, including any changes that may
   * occur to the global defaultImageOptions.
   */
  imageOptions: FimImageOptions;

  /**
   * Fills the image with a solid color
   * @param Fill color
   */
  fillSolid(color: FimColor | string): void;

  /**
   * Returns the value of one pixel.
   *
   * Note that this call is fairly inefficient, and should only be used infrequently, mainly for debugging.
   *
   * @param x X-offset, in pixels
   * @param y Y-offset, in pixels
   * @returns RGBA color value
   */
  getPixel(x: number, y: number): FimColor;

  /**
   * Sets the value of one pixel.
   *
   * Note that this call is fairly inefficient, and should only be used infrequently, mainly for debugging.
   *
   * @param x X-offset, in pixels
   * @param y Y-offset, in pixels
   * @param color RGBA color value
   */
  setPixel(x: number, y: number, color: FimColor | string): void;
}
