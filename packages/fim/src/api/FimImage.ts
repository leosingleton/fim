// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
import { FimImageOptions, mergeImageOptions } from './FimImageOptions';

/**
 */
export abstract class FimImage {
  protected constructor(fim: Fim, options?: FimImageOptions) {
    this.fim = fim;
    this.imageOptions = options ?? {};
  }

  public imageOptions: FimImageOptions;

  protected computeImageOptions(): FimImageOptions {
    return mergeImageOptions(this.fim.defaultImageOptions, this.imageOptions);
  }

  private fim: Fim;
}
