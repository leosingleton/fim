// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpLinearTransform2 } from './FimOpLinearTransform2';
import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperation } from '../api/FimOperation';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to subtract the RGB values of two images */
export class FimOpSubtract extends FimOperation {
  /**
   * Constructor
   * @param fim FIM instance
   */
  public constructor(fim: Fim) {
    super(fim, 'Subtract');
    this.linearTransform2 = new FimOpLinearTransform2(fim);
    this.addChild(this.linearTransform2);
  }

  /** Internally, subtract is implemented with the linear transformation operation */
  private readonly linearTransform2: FimOpLinearTransform2;

  /**
   * Sets the inputs of the subtract shader
   * @param input1 Input image 1
   * @param input2 Input image 2 (to subtract from 1)
   * @param constant Optional constant to add to every RGB component
   */
  public setInputs(input1: FimImage, input2: FimImage, constant = 0): void {
    this.linearTransform2.setInputs(input1, input2, 1, -1, constant);
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.linearTransform2.executeAsync(outputImage, destCoords);
  }
}
