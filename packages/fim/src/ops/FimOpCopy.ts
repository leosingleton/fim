// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperationShader } from '../api/FimOperationShader';

/** Built-in operation to copy one image to another */
export class FimOpCopy extends FimOperationShader {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    const source = require('../../build/core/glsl/copy.glsl.js');
    super(parent, source, undefined, 'Copy');
  }

  /**
   * Sets the inputs of the copy shader. Returns `this` so the operation may be run in a one-line call to
   * `FimImage.executeAsync()`.
   * @param input Input image
   * @returns `this`
   */
  public $(input: FimImage): this {
    this.shader.setUniforms({
      uInput: input
    });
    return this;
  }
}
