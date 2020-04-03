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

  /** Small 128x32 dimensions */
  export const smallWide4 = FimDimensions.fromWidthHeight(128, 32);

  /** Small 128x128 dimensions, also used by the four squares sample images */
  export const smallSquare = FimDimensions.fromSquareDimension(128);

  /** Medium 640x160 dimensions */
  export const mediumWide4 = FimDimensions.fromWidthHeight(640, 160);

  /** Medium 640x640 dimensions */
  export const mediumSquare = FimDimensions.fromSquareDimension(640);
}
