// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestColors } from './TestColors';
import { FimColor, FimImage } from '@leosingleton/fim';

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
      case 0:   return TestColors.red;
      case 1:   return TestColors.green;
      case 2:   return TestColors.blue;
      default:  return TestColors.white;
    }
  }

  /** Generator function for a test pattern that stresses copy operations. Pixels have a noise-like pattern. */
  export function copyStress(x: number, y: number): FimColor {
    return FimColor.fromRGBABytes(x % 256, (x + y) % 256, (x * y) % 256, 255);
  }

  /**
   * Renders a test pattern to the destination image
   * @param destImage Destination image
   * @param generator Test pattern generator function
   */
  export function renderAsync(destImage: FimImage, generator: GeneratorFn): Promise<void> {
    const pixelData = new Uint8ClampedArray(destImage.dim.getArea() * 4);
    for (let y = 0; y < destImage.dim.h; y++) {
      const yOffset = y * destImage.dim.w * 4;
      for (let x = 0; x < destImage.dim.w; x++) {
        const offset = (x * 4) + yOffset;
        const color = generator(x, y);
        pixelData[offset] = color.r;
        pixelData[offset + 1] = color.g;
        pixelData[offset + 2] = color.b;
        pixelData[offset + 3] = color.a;
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
    const pixelData = await srcImage.exportToPixelDataAsync();
    for (let y = 0; y < srcImage.dim.h; y++) {
      const yOffset = y * srcImage.dim.w * 4;
      for (let x = 0; x < srcImage.dim.w; x++) {
        const offset = (x * 4) + yOffset;
        const expected = generator(x, y);
        const found = FimColor.fromRGBABytes(pixelData[offset], pixelData[offset + 1], pixelData[offset + 2],
          pixelData[offset + 3]);
        if (!found.equals(expected)) {
          if (throwOnError) {
            throw Error(`(${x},${y}) expected: ${expected.string} found: ${found.string}`);
          }
          return false;
        }
      }
    }
    return true;
  }
}
