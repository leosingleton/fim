// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FaFimObject } from './FaFimObject';
import { Fim } from '../../api/Fim';
import { FimImage } from '../../api/FimImage';
import { FimImageOptions, mergeImageOptions } from '../../api/FimImageOptions';
import { FimColor } from '../../primitives/FimColor';

/** Internal implementation of the FimImage interface */
export abstract class FaFimImage extends FaFimObject implements FimImage {
  /**
   * Constructor
   * @param fim Parent FIM object
   * @param options Optional image options to override the parent FIM's defaults
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  protected constructor(fim: Fim, options?: FimImageOptions, objectName?: string) {
    super('img', objectName);
    this.fim = fim;
    this.imageOptions = options ?? {};
  }

  /**
   * Image options
   *
   * Note that these properties are read/write. The application may attempt to change them after image creation,
   * however changes are not guaranteed to take effect immediately. Generally options take effect on the next method
   * call, however some require calling releaseResources() to recreate the back-end objects altogether.
   *
   * Also note that an undefined value here inherits the value from the parent FIM class, including any changes that may
   * occur to the global defaultImageOptions.
   */
  public imageOptions: FimImageOptions;

  public releaseResources(): void {
    this.ensureNotDisposed();
  }

  /** Fills the image with a solid color */
  public fillSolid(_color: FimColor | string): void {
    this.ensureNotDisposed();
  }

  protected computeImageOptions(): FimImageOptions {
    return mergeImageOptions(this.fim.defaultImageOptions, this.imageOptions);
  }

  private fim: Fim;
}
