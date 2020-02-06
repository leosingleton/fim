// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionOptions, defaultExecutionOptions } from './FimExecutionOptions';
import { FimImageOptions, defaultImageOptions } from './FimImageOptions';

/**
 */
export abstract class Fim {
  protected constructor() {
    // Initialize options to library defaults. The properties are public, so API clients may change them after FIM
    // creation.
    this.executionOptions = defaultExecutionOptions;
    this.defaultImageOptions = defaultImageOptions;
  }

  /** Options for the FIM execution engine */
  public executionOptions: FimExecutionOptions;

  /** Default image options. Values here are used unless overridden within the image itself.  */
  public defaultImageOptions: FimImageOptions;
}
