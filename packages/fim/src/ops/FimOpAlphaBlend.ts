// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperationShader } from '../api/FimOperationShader';

/** Built-in operation to perform an alpha blend between two images */
export class FimOpAlphaBlend extends FimOperationShader {
  /**
   * Constructor
   * @param fim FIM instance
   */
  public constructor(fim: Fim) {
    const source = require('../../build/ops/glsl/AlphaBlend.glsl.js');
    const shader = fim.createGLShader(source, undefined, 'AlphaBlend');
    super(fim, shader);
  }

  /**
   * Sets the inputs of the alpha blend shader
   * @param input1 Input image 1
   * @param input2 Input image 2
   * @param alpha Amount of `input1` (from 0.0 to 1.0)
   */
  public setInputs(input1: FimImage, input2: FimImage, alpha: number): void {
    this.shader.setUniforms({
      uInput1: input1,
      uInput2: input2,
      uInput1Alpha: alpha
    });
  }
}
