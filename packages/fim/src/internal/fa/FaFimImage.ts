// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FaFimObject } from './FaFimObject';
import { Fim } from '../../api/Fim';
import { FimImage } from '../../api/FimImage';
import { FimImageOptions, mergeImageOptions } from '../../api/FimImageOptions';
import { FimColor } from '../../primitives/FimColor';
import { FcImageFillSolid } from '../fc/FcImageFillSolid';
import { FeDispatcher } from '../fe/FeDispatcher';

/** Internal implementation of the FimImage interface */
export abstract class FaFimImage extends FaFimObject implements FimImage {
  /**
   * Constructor
   * @param fim Parent FIM object
   * @param dispatcher Back-end FIM engine
   * @param options Optional image options to override the parent FIM's defaults
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  protected constructor(fim: Fim, dispatcher: FeDispatcher, options?: FimImageOptions, objectName?: string) {
    super(dispatcher, 'img', objectName);
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

  /** Fills the image with a solid color */
  public fillSolid(color: FimColor | string): void {
    // Force color to be a string
    const colorString = (typeof(color) === 'string') ? color : color.string;

    const cmd: FcImageFillSolid = {
      cmd: 'ifs',
      destOptions: this.computeImageOptions(),
      color: colorString
    };
    this.dispatchCommand(cmd);
  }

  /**
   * Computes the effective image options by merging this object's options with the parent's. This should be called
   * regularly as image options may change at any time.
   */
  protected computeImageOptions(): FimImageOptions {
    return mergeImageOptions(this.fim.defaultImageOptions, this.imageOptions);
  }

  private fim: Fim;
}
