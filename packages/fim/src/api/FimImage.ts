// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageOptions } from './FimImageOptions';
import { FimColor } from '../primitives/FimColor';

/**
 */
export interface FimImage {
  readonly handle: number;

  imageOptions: FimImageOptions;

  /** Fills the image with a solid color */
  fillSolid(color: FimColor | string): void;
}
