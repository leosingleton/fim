// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpLinearTransform1 } from './FimOpLinearTransform1';
import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperation } from '../api/FimOperation';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to apply a y = mx + b transformation such as adjusting image brightness and/or contrast */
export class FimOpBrightnessContrast extends FimOperation {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    super(parent, 'BrightnessContrast');
    this.linearTransform1 = new FimOpLinearTransform1(this);
  }

  /** Internally, brightness/contrast adjustments are implemented with the linear transformation operation */
  private readonly linearTransform1: FimOpLinearTransform1;

  /**
   * Sets the inputs to perform brightness and contrast adjustion. Returns `this` so the operation may be run in a
   * one-line call to `FimImage.executeAsync()`.
   * @param input Input
   * @param brightness Value from -1 to 1, where 0 is no change
   * @param contrast Value from -1 to 1, where 0 is no change
   * @returns `this`
   */
  public $(input: FimImage, brightness: number, contrast: number): this {
    // To adjust contrast (c), we multiply to increase the slope, however we want to keep the midpoint at 0.5.
    //   Solving y = mx + b, we get: y = cx + (0.5 - 0.5c)
    // The contrast parameter is -1 to 1 and needs to be scaled to 0 to Infinity
    //   -1 to 0 ==> (c + 1)
    //    0 to 1 ==>  1 / (1 - c)
    // Thus m and b in y = mx + b are below:
    const m = (contrast < 0.0) ? (contrast + 1.0) : (1.0 / (1.0 - contrast));
    const b = 0.5 - (0.5 * m) + brightness;
    this.linearTransform1.$(input, m, b);

    return this;
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.linearTransform1.executeAsync(outputImage, destCoords);
  }
}
