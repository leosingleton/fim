// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FaFimObject } from './FaFimObject';
import { Fim } from '../../api/Fim';
import { FimExecutionOptions, defaultExecutionOptions } from '../../api/FimExecutionOptions';
import { FimImageOptions, defaultImageOptions } from '../../api/FimImageOptions';
import { FimReleaseResourcesFlags } from '../../api/FimReleaseResourcesFlags';

/** Internal implementation of the Fim interface */
export abstract class FaFim extends FaFimObject implements Fim {
  /**
   * Constructor
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  protected constructor(objectName?: string) {
    super('fim', objectName);

    // Initialize options to library defaults. The properties are public, so API clients may change them after FIM
    // creation.
    this.executionOptions = defaultExecutionOptions;
    this.defaultImageOptions = defaultImageOptions;
  }

  /**
   * Options for the FIM execution engine
   *
   * Note that these properties are read/write. The application may attempt to change them after creating objects,
   * however changes are not guaranteed to take effect immediately. Generally options take effect on the next method
   * call, however some require calling releaseResources() to recreate the back-end objects altogether.
   */
  public executionOptions: FimExecutionOptions;

  /** Default image options. Values here are used unless overridden within the image itself.  */
  public defaultImageOptions: FimImageOptions;

  public releaseResources(_flags: FimReleaseResourcesFlags): void {
    this.ensureNotDisposed();
  }
}
