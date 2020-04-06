// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperationShader } from '../api/FimOperationShader';
import { FimTransform2D } from '../math/FimTransform2D';
import { FimTransform3D } from '../math/FimTransform3D';

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
   * @param vertexMatrix 3x3 or 4x4 matrix used to manipulate vertices. The Transform2D and Transform3D
   *    classes can help to create the vertex transformation matrices.
   * @returns `this`
   */
  public $(input: FimImage, vertexMatrix?: FimTransform2D | FimTransform3D | number[]): this {
    this.shader.setUniforms({
      uInput: input
    });

    if (vertexMatrix) {
      this.shader.applyVertexMatrix(vertexMatrix);
    }

    return this;
  }
}
