// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimShaderWrapper } from '../api/FimShaderWrapper';

/** Built-in shader to combine two textures and return the darker of the two */
export class FimShaderDarker extends FimShaderWrapper {
  /**
   * Constructor
   * @param fim FIM instance
   */
  public constructor(fim: Fim) {
    const source = require('../../build/shaders/glsl/Darker.glsl.js');
    const shader = fim.createGLShader(source, undefined, 'Darker');
    super(fim, shader);
  }

  /**
   * Sets the inputs of the darker shader
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
