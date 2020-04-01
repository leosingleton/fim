// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions, FimPoint, FimColor } from '@leosingleton/fim';

/** Calculates the expected length of pixel data given dimensions */
export function expectedPixelDataLength(dimensions: FimDimensions): number {
  return dimensions.w * dimensions.h * 4;
}

/**
 * Reads a pixel from a pixel data array
 * @param pixelData Pixel data array
 * @param dimensions Dimensions of the pixel data array
 * @param point Pixel to read
 * @returns Pixel color
 */
export function getPixelFromPixelData(pixelData: Uint8ClampedArray, dimensions: FimDimensions, point: FimPoint):
    FimColor {
  const offset = ((dimensions.w * point.y) + point.x) * 4;
  return FimColor.fromRGBABytes(pixelData[offset], pixelData[offset + 1], pixelData[offset + 2], pixelData[offset + 3]);
}
