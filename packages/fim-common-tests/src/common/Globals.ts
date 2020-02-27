// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor, FimDimensions, FimPoint } from '@leosingleton/fim';

/** Small 100x100 canvas dimensions */
export const small = FimDimensions.fromWidthHeight(100, 100);

/** Midpoint of the small 100x100 canvas */
export const smallMidpoint = FimPoint.fromXY(50, 50);

/** Small 128x128 canvas dimensions, used by four squares sample image */
export const smallFourSquares = FimDimensions.fromWidthHeight(128, 128);

/** Returns a point in the top-left quadrant */
export function topLeft(dimensions = smallFourSquares): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.25, dimensions.h * 0.25).toFloor();
}

/** Returns a point in the top-right quadrant */
export function topRight(dimensions = smallFourSquares): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.75, dimensions.h * 0.25).toFloor();
}

/** Returns a point in the bottom-left quadrant */
export function bottomLeft(dimensions = smallFourSquares): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.25, dimensions.h * 0.75).toFloor();
}

/** Returns a point in the bottom-right quadrant */
export function bottomRight(dimensions = smallFourSquares): FimPoint {
  return FimPoint.fromXY(dimensions.w * 0.75, dimensions.h * 0.75).toFloor();
}

/** Medium 500x500 canvas dimensions */
export const medium = FimDimensions.fromWidthHeight(500, 500);

/** Midpoint of the medium 500x500 canvas */
export const mediumMidpoint = FimPoint.fromXY(250, 250);

export const red = FimColor.fromString('#f00');
export const green = FimColor.fromString('#0f0');
export const blue = FimColor.fromString('#00f');
export const black = FimColor.fromString('#000');
export const white = FimColor.fromString('#fff');
