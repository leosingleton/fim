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
  protected constructor(fim: Fim, options?: FimImageOptions, objectName?: string) {
    super('img', objectName);
    this.fim = fim;
    this.imageOptions = options ?? {};
  }

  /** Image options */
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
