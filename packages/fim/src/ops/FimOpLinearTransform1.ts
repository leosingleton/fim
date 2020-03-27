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
    const shader = parent.rootObject.createGLShader(source, undefined, 'LinearTransform1');
    super(parent, shader);
  }

  /**
   * Sets the inputs to perform a linear transformation of the input image
   * @param input Input
   * @param m Slope
   * @param b Y-offset
   */
  public setInputs(input: FimImage, m: number, b: number): void {
    this.shader.setUniforms({
      uInput: input,
      uM: m,
      uB: [b, b, b]
    });
  }
}
