// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from '@leosingleton/fim';

/** Standard dimensions for unit tests */
export namespace TestSizes {
  /** Small 128x32 dimensions */
  export const smallWide = FimDimensions.fromWidthHeight(128, 32);

  /** Small 128x128 dimensions, also used by the four squares sample images */
  export const smallSquare = FimDimensions.fromSquareDimension(128);

  /** Small 32x128 dimensions */
  export const smallTall = FimDimensions.fromWidthHeight(32, 128);

  /** Medium 640x160 dimensions */
  export const mediumWide = FimDimensions.fromWidthHeight(640, 160);

  /** Medium 640x640 dimensions */
  export const mediumSquare = FimDimensions.fromSquareDimension(640);

  /** Medium 160x640 dimensions */
  export const mediumTall = FimDimensions.fromWidthHeight(160, 640);

  /** Large 1920x480 dimensions */
  export const largeWide = FimDimensions.fromWidthHeight(1920, 480);

  /** Large 1920x1920 dimensions */
  export const largeSquare = FimDimensions.fromSquareDimension(1920);

  /** Large 480x1920 dimensions */
  export const largeTall = FimDimensions.fromWidthHeight(480, 1920);
}
