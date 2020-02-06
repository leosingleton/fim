// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionOptions } from './FimExecutionOptions';
import { FimImageOptions } from './FimImageOptions';

/**
 */
export interface Fim {
  readonly handle: number;

  /** Options for the FIM execution engine */
  executionOptions: FimExecutionOptions;

  /** Default image options. Values here are used unless overridden within the image itself.  */
  defaultImageOptions: FimImageOptions;
}
