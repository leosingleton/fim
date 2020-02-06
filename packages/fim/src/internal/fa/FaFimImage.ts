// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '../../api/Fim';
import { FimImage } from '../../api/FimImage';
import { FimImageOptions, mergeImageOptions } from '../../api/FimImageOptions';
import { FimColor } from '../../primitives/FimColor';

/** Internal implementation of the FimImage interface */
export abstract class FaFimImage implements FimImage {
  protected constructor(fim: Fim, options?: FimImageOptions) {
    this.handle = FaFimImage.globalHandleCount++;
    this.fim = fim;
    this.imageOptions = options ?? {};
  }

  /** Unique value identifying this image */
  public readonly handle: number;

  /** Image options */
  public imageOptions: FimImageOptions;

  public releaseResources(): void {
  }

  /** Fills the image with a solid color */
  public fillSolid(_color: FimColor | string): void {
  }

  protected computeImageOptions(): FimImageOptions {
    return mergeImageOptions(this.fim.defaultImageOptions, this.imageOptions);
  }

  private fim: Fim;

  /** Static counter used to create unique handle values */
  private static globalHandleCount = 20000;
}
