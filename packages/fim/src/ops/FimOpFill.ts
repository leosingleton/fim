// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObject } from '../api/FimObject';
import { FimOperationShader } from '../api/FimOperationShader';
import { FimColor } from '../primitives/FimColor';

/** Built-in operation to fill an image with a solid color */
export class FimOpFill extends FimOperationShader {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    const source = require('../../build/core/glsl/fill.glsl.js');
    super(parent, 'Fill', source);
  }

  /**
   * Sets the inputs of the fill shader. Returns `this` so the operation may be run in a one-line call to
   * `FimImage.executeAsync()`.
   * @param fillColor Fill color
   * @returns `this`
   */
  public $(fillColor: FimColor): this {
    this.shader.setUniforms({
      uColor: fillColor.toVector()
    });
    return this;
  }
}
