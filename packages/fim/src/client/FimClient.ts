// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '../api/Fim';
import { FimExecutionOptions, defaultExecutionOptions } from '../api/FimExecutionOptions';
import { FimImageOptions, defaultImageOptions } from '../api/FimImageOptions';

/**
 */
export abstract class FimClient implements Fim {
  protected constructor() {
    this.handle = FimClient.globalHandleCount++;

    // Initialize options to library defaults. The properties are public, so API clients may change them after FIM
    // creation.
    this.executionOptions = defaultExecutionOptions;
    this.defaultImageOptions = defaultImageOptions;
  }

  public readonly handle: number;

  /** Options for the FIM execution engine */
  public executionOptions: FimExecutionOptions;

  /** Default image options. Values here are used unless overridden within the image itself.  */
  public defaultImageOptions: FimImageOptions;

  private static globalHandleCount = 10000;
}
