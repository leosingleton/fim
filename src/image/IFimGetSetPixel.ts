// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor } from '../primitives';

/** Interface implemented by images that can get and set individual pixels */
export interface IFimGetSetPixel {
  /**
   * Returns the value of one pixel
   * @param x X-offset, in pixels
   * @param y Y-offset, in pixels
   * @returns RGBA color value
   */
  getPixel(x: number, y: number): FimColor;

  /**
   * Sets the value of one pixel
   * @param x X-offset, in pixels
   * @param y Y-offset, in pixels
   * @param color RGBA color value
   */
  setPixel(x: number, y: number, color: FimColor): void;
}
