// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpLinearTransform } from './FimOpLinearTransform';
import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperation } from '../api/FimOperation';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to apply a y = mx + b transformation such as adjusting image brightness and/or contrast */
export class FimOpBrightnessContrast extends FimOperation {
  /**
   * Constructor
   * @param fim FIM instance
   */
  public constructor(fim: Fim) {
    super(fim, 'BrightnessContrast');
    this.linearTransform = new FimOpLinearTransform(fim);
    this.registerChildObject(this.linearTransform);
  }

  /** Internally, brightness/contrast adjustments are implemented with the linear transformation operation */
  private readonly linearTransform: FimOpLinearTransform;

  /**
   * Sets the inputs to perform brightness and contrast adjustion
   * @param input Input
   * @param brightness Value from -1 to 1, where 0 is no change
   * @param contrast Value from -1 to 1, where 0 is no change
   */
  public setInputs(input: FimImage, brightness: number, contrast: number): void {
    // To adjust contrast (c), we multiply to increase the slope, however we want to keep the midpoint at 0.5.
    //   Solving y = mx + b, we get: y = cx + (0.5 - 0.5c)
    // The contrast parameter is -1 to 1 and needs to be scaled to 0 to Infinity
    //   -1 to 0 ==> (c + 1)
    //    0 to 1 ==>  1 / (1 - c)
    // Thus m and b in y = mx + b are below:
    const m = (contrast < 0.0) ? (contrast + 1.0) : (1.0 / (1.0 - contrast));
    const b = 0.5 - (0.5 * m) + brightness;
    this.linearTransform.setInputs(input, m, b);
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.linearTransform.executeAsync(outputImage, destCoords);
  }
}
