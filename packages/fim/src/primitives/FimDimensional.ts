// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from './FimDimensions';

/** Interface for objects which have dimensions */
export interface FimDimensional {
  /** Object dimensions */
  readonly dim: FimDimensions;
}
