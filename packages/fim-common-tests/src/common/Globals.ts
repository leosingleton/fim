// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor, FimDimensions } from '@leosingleton/fim';

/** Small 100x100 canvas dimensions */
export const small = FimDimensions.fromWidthHeight(100, 100);

/** Small 128x128 canvas dimensions, used by four squares sample image */
export const smallFourSquares = FimDimensions.fromWidthHeight(128, 128);

/** Medium 500x500 canvas dimensions */
export const medium = FimDimensions.fromWidthHeight(500, 500);

export const red = FimColor.fromString('#f00');
export const green = FimColor.fromString('#0f0');
export const blue = FimColor.fromString('#00f');
export const black = FimColor.fromString('#000');
export const white = FimColor.fromString('#fff');
