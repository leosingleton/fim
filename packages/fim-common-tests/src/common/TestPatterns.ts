// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { blue, green, red, white } from './Globals';
import { FimColor, FimImage, FimPoint } from '@leosingleton/fim';

/** Generates and validates test patterns for unit testing */
export module TestPatterns {
  /** Function which generates a pattern of colors for x/y coordinates */
  export type GeneratorFn = (x: number, y: number) => FimColor;

  /** Generator function for greyscale horizontal gradients */
  export function horizontalGradient(x: number, y: number): FimColor {
    return FimColor.fromRGBABytes(y % 256, y % 256, y % 256, 255);
  }

  /** Generator function for greyscale vertical gradients */
  export function verticalGradient(x: number, _y: number): FimColor {
    return FimColor.fromRGBABytes(x % 256, x % 256, x % 256, 255);
  }

  /** Generator function for a test pattern that stresses downscale operations. On average, it is 50% grey. */
  export function downscaleStress(x: number, _y: number): FimColor {
    switch (x % 4) {
      case 0:   return red;
      case 1:   return green;
      case 2:   return blue;
      default:  return white;
    }
  }

  /**
   * Renders a test pattern to the destination image
   * @param destImage Destination image
   * @param generator Test pattern generator function
   */
  export function renderAsync(destImage: FimImage, generator: GeneratorFn): Promise<void> {
    const pixelData = new Uint8ClampedArray(destImage.imageDimensions.getArea() * 4);
    for (let y = 0; y < destImage.imageDimensions.h; y++) {
      const yOffset = y * destImage.imageDimensions.w * 4;
      for (let x = 0; x < destImage.imageDimensions.w; x++) {
        const xOffset = x * 4;
        const color = generator(x, y);
        pixelData[yOffset + xOffset] = color.r;
        pixelData[yOffset + xOffset + 1] = color.g;
        pixelData[yOffset + xOffset + 2] = color.b;
        pixelData[yOffset + xOffset + 3] = color.a;
      }
    }

    return destImage.loadPixelDataAsync(pixelData);
  }

  /**
   * Validates a test pattern on the source image
   * @param srcImage Source image
   * @param generator Test pattern generator function
   * @param throwOnError By default, returns false on error. If set, throws an error instead.
   * @returns True on success; false (or exception) on failure
   */
  export async function validateAsync(srcImage: FimImage, generator: GeneratorFn, throwOnError = false):
      Promise<boolean> {
    for (let x = 0; x < srcImage.imageDimensions.w; x++) {
      for (let y = 0; y < srcImage.imageDimensions.h; y++) {
        const expected = generator(x, y);
        const found = await srcImage.getPixelAsync(FimPoint.fromXY(x, y));
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
