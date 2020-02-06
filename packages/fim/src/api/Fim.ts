// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionOptions } from './FimExecutionOptions';
import { FimImageOptions } from './FimImageOptions';
import { FimReleasable } from '../primitives/FimReleasable';

/**
 * Parent object when using the FIM library. This object holds images, shaders, and operations used to manipulate 2D
 * images within JavaScript using WebGL.
 */
export interface Fim extends FimReleasable {
  /** Unique value identifying this FIM instance */
  readonly handle: number;

  /** Options for the FIM execution engine */
  executionOptions: FimExecutionOptions;

  /** Default image options. Values here are used unless overridden within the image itself.  */
  defaultImageOptions: FimImageOptions;
}
