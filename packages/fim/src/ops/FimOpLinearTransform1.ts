// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperationShader } from '../api/FimOperationShader';

/** Built-in operation to apply a linear transformation with one input (y = mx + b) */
export class FimOpLinearTransform1 extends FimOperationShader {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    const source = require('../../build/ops/glsl/LinearTransform1.glsl.js');
    super(parent, 'LinearTransform1', source);
  }

  /**
   * Sets the inputs to perform a linear transformation of the input image. Returns `this` so the operation may be run
   * in a one-line call to `FimImage.executeAsync()`.
   * @param input Input
   * @param m Slope
   * @param b Y-offset
   * @returns `this`
   */
  public $(input: FimImage, m: number, b: number): this {
    this.shader.setUniforms({
      uInput: input,
      uM: m,
      uB: [b, b, b]
    });

    return this;
  }
}
