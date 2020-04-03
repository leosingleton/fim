// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestSizes } from './TestSizes';
import { FimDimensions, FimPoint } from '@leosingleton/fim';

/** Returns the midpoint of the provided dimensions */
export function midpoint(dimensions: FimDimensions): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.5, dimensions.h * 0.5).toFloor();
}

/** Returns a point in the top-left quadrant */
export function topLeft(dimensions = TestSizes.smallSquare): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.25, dimensions.h * 0.25).toFloor();
}

/** Returns a point in the top-right quadrant */
export function topRight(dimensions = TestSizes.smallSquare): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.75, dimensions.h * 0.25).toFloor();
}

/** Returns a point in the bottom-left quadrant */
export function bottomLeft(dimensions = TestSizes.smallSquare): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.25, dimensions.h * 0.75).toFloor();
}

/** Returns a point in the bottom-right quadrant */
export function bottomRight(dimensions = TestSizes.smallSquare): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.75, dimensions.h * 0.75).toFloor();
}

/** URL to the sample-images folder */
export const sampleImagesUrl = 'https://www.leosingleton.com/sample-images';
