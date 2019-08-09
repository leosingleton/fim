// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IFimGetSetPixel } from '../image';
import { FimColor, IFimDimensions } from '../primitives';

/**
 * Generates and validates test patterns. Primarily used for unit testing, although it ships as an export of the
 * library, so could be used externally.
 */
export module FimTestPatterns {
  /** Function which generates a pattern of colors for x/y coordinates */
  export type GeneratorFn = (x: number, y: number) => FimColor;

  /** Generator function for greyscale horizontal gradients */
  export function horizontalGradient(x: number, y: number): FimColor {
    return FimColor.fromRGBABytes(y % 256, y % 256, y % 256, 255);
  }

  /** Generator function for greyscale vertical gradients */
  export function verticalGradient(x: number, y: number): FimColor {
    return FimColor.fromRGBABytes(x % 256, x % 256, x % 256, 255);
  }

  /**
   * Renders a test pattern to the destination image
   * @param destImage Destination image
   * @param generator Test pattern generator function
   */
  export function render(destImage: IFimDimensions & IFimGetSetPixel, generator: GeneratorFn): void {
    for (let x = 0; x < destImage.w; x++) {
      for (let y = 0; y < destImage.h; y++) {
        destImage.setPixel(x, y, generator(x, y));
      }
    }
  }

  /**
   * Validates a test pattern on the source image
   * @param srcImage Source image
   * @param generator Test pattern generator function
   * @param throwOnError By default, returns false on error. If set, throws an error instead.
   * @returns True on success; false (or exception) on failure
   */
  export function validate(srcImage: IFimDimensions & IFimGetSetPixel, generator: GeneratorFn, throwOnError = false):
      boolean {
    for (let x = 0; x < srcImage.w; x++) {
      for (let y = 0; y < srcImage.h; y++) {
        let expected = generator(x, y);
        let found = srcImage.getPixel(x, y);
        if (!found.equals(expected)) {
          if (throwOnError) {
            throw Error(`(${x},${y}) expected: ${expected} found: ${found}`);
          }
          return false;
        }
      }
    }
    return true;
  }
}
