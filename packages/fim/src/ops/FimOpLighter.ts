// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperationShader } from '../api/FimOperationShader';

/** Built-in operation to combine two textures and return the lighter of the two */
export class FimOpLighter extends FimOperationShader {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    const source = require('../../build/ops/glsl/Lighter.glsl.js');
    super(parent, 'Lighter', source);
  }

  /**
   * Sets the inputs of the lighter shader. Returns `this` so the operation may be run in a one-line call to
   * `FimImage.executeAsync()`.
   * @param input1 Input image 1
   * @param input2 Input image 2
   * @returns `this`
   */
  public $(input1: FimImage, input2: FimImage): this {
    this.shader.setUniforms({
      uInput1: input1,
      uInput2: input2
    });

    return this;
  }
}
