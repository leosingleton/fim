// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimRect } from './FimRect';

/** Interface implemented by objects that expose their width and height */
export interface IFimDimensions {
  /** Width of the image, in pixels */
  readonly w: number;

  /** Height of the image, in pixels */
  readonly h: number;

  /** Dimensions of the image, in pixels. The x/y coordinates are always zero. */
  readonly dimensions: FimRect;
}

/**
 * Creates an IFimDimensions object with the specified width and height
 * @param width Width
 * @param height Height
 * @returns Object implementing IFimDimensions
 */
export function createDimensions(width: number, height: number): IFimDimensions {
  return {
    w: width,
    h: height,
    dimensions: FimRect.fromXYWidthHeight(0, 0, width, height)
  };
}

/**
 * Rescales a set of dimensions, preserving aspect ratio
 * @param inputDimensions Input dimensions
 * @param maxDimension Maximum value of either width or height
 * @returns Downscaled IFimDimensions with the same aspect ratio as the original. Note that the dimensions are rounded
 *    to the nearest pixel, so the aspect ratio may be slightly different due to rounding errors.
 */
export function rescaleDimensions(inputDimensions: IFimDimensions, maxDimension: number): IFimDimensions {
  let newDimensions = inputDimensions.dimensions.rescale(maxDimension);
  return {
    w: newDimensions.w,
    h: newDimensions.h,
    dimensions: newDimensions
  };
}

/**
 * Rescales a set of dimensions, preserving aspect ratio
 * @param width Input width
 * @param height Input height
 * @param maxDimension Maximum value of either width or height
 * @returns Downscaled IFimDimensions with the same aspect ratio as the original. Note that the dimensions are rounded
 *    to the nearest pixel, so the aspect ratio may be slightly different due to rounding errors.
 */
export function rescale(width: number, height: number, maxDimension: number): IFimDimensions {
  let inputDimensions = createDimensions(width, height);
  let newDimensions = inputDimensions.dimensions.rescale(maxDimension);
  return {
    w: newDimensions.w,
    h: newDimensions.h,
    dimensions: newDimensions
  };
}
