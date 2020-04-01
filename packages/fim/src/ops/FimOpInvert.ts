// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpLinearTransform1 } from './FimOpLinearTransform1';
import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperation } from '../api/FimOperation';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to invert an image */
export class FimOpInvert extends FimOperation {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    super(parent, 'Invert');
    this.linearTransform1 = new FimOpLinearTransform1(this);
  }

  /** Internally, invert is implemented with the linear transformation operation */
  private readonly linearTransform1: FimOpLinearTransform1;

  /**
   * Sets the input image to invert. Returns `this` so the operation may be run in a one-line call to
   * `FimImage.executeAsync()`.
   * @param input Input image
   * @returns `this`
   */
  public $(input: FimImage): this {
    this.linearTransform1.$(input, -1, 1);
    return this;
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.linearTransform1.executeAsync(outputImage, destCoords);
  }
}
