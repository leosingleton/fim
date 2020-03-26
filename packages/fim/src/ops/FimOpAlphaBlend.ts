// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpLinearTransform2 } from './FimOpLinearTransform2';
import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperation } from '../api/FimOperation';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to perform an alpha blend between two images */
export class FimOpAlphaBlend extends FimOperation {
  /**
   * Constructor
   * @param fim FIM instance
   */
  public constructor(fim: Fim) {
    super(fim, 'AlphaBlend');
    this.linearTransform2 = new FimOpLinearTransform2(fim);
    this.addChild(this.linearTransform2);
  }

  /** Internally, alpha blend is implemented with the linear transformation operation */
  private readonly linearTransform2: FimOpLinearTransform2;

  /**
   * Sets the inputs of the alpha blend shader
   * @param input1 Input image 1
   * @param input2 Input image 2
   * @param alpha Amount of `input1` (from 0.0 to 1.0)
   */
  public setInputs(input1: FimImage, input2: FimImage, alpha: number): void {
    this.linearTransform2.setInputs(input1, input2, alpha, 1 - alpha, 0);
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.linearTransform2.executeAsync(outputImage, destCoords);
  }
}
