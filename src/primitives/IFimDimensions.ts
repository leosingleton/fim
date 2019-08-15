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
  readonly imageDimensions: FimRect;
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
    imageDimensions: FimRect.fromWidthHeight(width, height)
  };
}
