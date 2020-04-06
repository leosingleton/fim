// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpLinearTransform2 } from './FimOpLinearTransform2';
import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperation } from '../api/FimOperation';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to perform an alpha blend between two images */
export class FimOpAlphaBlend extends FimOperation {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    super(parent, 'AlphaBlend');
    this.linearTransform2 = new FimOpLinearTransform2(this);
  }

  /** Internally, alpha blend is implemented with the linear transformation operation */
  private readonly linearTransform2: FimOpLinearTransform2;

  /**
   * Sets the inputs of the alpha blend shader. Returns `this` so the operation may be run in a one-line call to
   * `FimImage.executeAsync()`.
   * @param input1 Input image 1
   * @param input2 Input image 2
   * @param alpha Amount of `input1` (from 0.0 to 1.0)
   * @returns `this`
   */
  public $(input1: FimImage, input2: FimImage, alpha: number): this {
    this.linearTransform2.$(input1, input2, alpha, 1 - alpha, 0);
    return this;
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.linearTransform2.executeAsync(outputImage, destCoords);
  }
}
