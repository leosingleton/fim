// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
import { FimImageOptions, mergeImageOptions } from './FimImageOptions';
import { FimColor } from '../primitives/FimColor';

/**
 */
export abstract class FimImage {
  protected constructor(fim: Fim, options?: FimImageOptions) {
    this.handle = FimImage.globalHandleCount++;
    this.fim = fim;
    this.imageOptions = options ?? {};
  }

  public readonly handle: number;

  public imageOptions: FimImageOptions;

  /** Fills the image with a solid color */
  public fillSolid(_color: FimColor | string): void {
  }

  protected computeImageOptions(): FimImageOptions {
    return mergeImageOptions(this.fim.defaultImageOptions, this.imageOptions);
  }

  private fim: Fim;

  private static globalHandleCount = 20000;
}
