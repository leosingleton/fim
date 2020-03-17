// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperationShader } from '../api/FimOperationShader';

/** Built-in operation to combine two textures and return the lighter of the two */
export class FimOpLighter extends FimOperationShader {
  /**
   * Constructor
   * @param fim FIM instance
   */
  public constructor(fim: Fim) {
    const source = require('../../build/ops/glsl/Lighter.glsl.js');
    const shader = fim.createGLShader(source, undefined, 'Lighter');
    super(fim, shader);
  }

  /**
   * Sets the inputs of the lighter shader
   * @param input1 Input image 1
   * @param input2 Input image 2
   */
  public setInputs(input1: FimImage, input2: FimImage): void {
    this.shader.setUniforms({
      uInput1: input1,
      uInput2: input2
    });
  }
}
