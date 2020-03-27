// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperationShader } from '../api/FimOperationShader';

/** Built-in operation to apply a linear transformation with two inputs (y = m1x1 + m2x2 + b) */
export class FimOpLinearTransform2 extends FimOperationShader {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    const source = require('../../build/ops/glsl/LinearTransform2.glsl.js');
    super(parent, source, undefined, 'LinearTransform2');
  }

  /**
   * Sets the inputs to perform a linear transformation of the input image
   * @param input1 Input image 1
   * @param input2 Input image 2
   * @param m1 Multiplier for input image 1
   * @param m2 Multiplier for input image 2
   * @param b Constant
   */
  public setInputs(input1: FimImage, input2: FimImage, m1: number, m2: number, b: number): void {
    this.shader.setUniforms({
      uInput1: input1,
      uInput2: input2,
      uM1: m1,
      uM2: m2,
      uB: [b, b, b]
    });
  }
}
