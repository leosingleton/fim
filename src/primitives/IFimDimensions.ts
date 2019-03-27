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
