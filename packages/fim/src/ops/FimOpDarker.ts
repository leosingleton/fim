// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperationShader } from '../api/FimOperationShader';

/** Built-in operation to combine two textures and return the darker of the two */
export class FimOpDarker extends FimOperationShader {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    const source = require('../../build/ops/glsl/Darker.glsl.js');
    super(parent, source, undefined, 'Darker');
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
