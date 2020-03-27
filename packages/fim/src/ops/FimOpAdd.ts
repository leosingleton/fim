// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpLinearTransform2 } from './FimOpLinearTransform2';
import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperation } from '../api/FimOperation';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to add the RGB values of two images */
export class FimOpAdd extends FimOperation {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    super(parent, 'Add');
    this.linearTransform2 = new FimOpLinearTransform2(this);
    this.addChild(this.linearTransform2);
  }

  /** Internally, add is implemented with the linear transformation operation */
  private readonly linearTransform2: FimOpLinearTransform2;

  /**
   * Sets the inputs of the add shader
   * @param input1 Input image 1
   * @param input2 Input image 2
   * @param constant Optional constant to add to every RGB component
   */
  public setInputs(input1: FimImage, input2: FimImage, constant = 0): void {
    this.linearTransform2.setInputs(input1, input2, 1, 1, constant);
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.linearTransform2.executeAsync(outputImage, destCoords);
  }
}
