// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageOptions } from './FimImageOptions';
import { FimColor } from '../primitives/FimColor';
import { FimReleasable } from '../primitives/FimReleasable';

/** Represents an image and its data within the FIM library */
export interface FimImage extends FimReleasable {
  /** Unique value identifying this image */
  readonly handle: number;

  /** Image options */
  imageOptions: FimImageOptions;

  /** Fills the image with a solid color */
  fillSolid(color: FimColor | string): void;
}