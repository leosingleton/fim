// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '../../api/Fim';
import { FimExecutionOptions, defaultExecutionOptions } from '../../api/FimExecutionOptions';
import { FimImageOptions, defaultImageOptions } from '../../api/FimImageOptions';

/** Internal implementation of the Fim interface */
export abstract class FaFim implements Fim {
  protected constructor() {
    this.handle = FaFim.globalHandleCount++;

    // Initialize options to library defaults. The properties are public, so API clients may change them after FIM
    // creation.
    this.executionOptions = defaultExecutionOptions;
    this.defaultImageOptions = defaultImageOptions;
  }

  /** Unique value identifying this FIM instance */
  public readonly handle: number;

  /** Options for the FIM execution engine */
  public executionOptions: FimExecutionOptions;

  /** Default image options. Values here are used unless overridden within the image itself.  */
  public defaultImageOptions: FimImageOptions;

  public releaseResources(): void {
  }

  /** Static counter used to create unique handle values */
  private static globalHandleCount = 10000;
}
