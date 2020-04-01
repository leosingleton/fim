// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from '@leosingleton/fim';

/** Standard dimensions for unit tests */
export namespace TestSizes {
  /** Small 100x50 canvas dimensions */
  export const small = FimDimensions.fromWidthHeight(100, 50);

  /** Small 128x128 canvas dimensions, used by four squares sample image */
  export const smallFourSquares = FimDimensions.fromWidthHeight(128, 128);

  /** Medium 480x640 canvas dimensions */
  export const medium = FimDimensions.fromWidthHeight(480, 640);

  /** Large 1920x1080 canvas dimensions */
  export const large = FimDimensions.fromWidthHeight(1920, 1080);
}
