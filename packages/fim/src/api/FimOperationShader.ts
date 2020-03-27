// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';
import { FimObject } from './FimObject';
import { FimOperation } from './FimOperation';
import { FimShader } from './FimShader';
import { FimRect } from '../primitives/FimRect';

/**
 * Base class for building FIM operations out of a single WebGL shader. Derived classes may include the shader's source
 * code, instantiate it in the constructor, and add helper functions that set constants and uniforms.
 */
export abstract class FimOperationShader extends FimOperation {
  /**
   * Constructor
   * @param parent Parent object
   * @param shader `FimShader` instance created by the derived class's constructor
   * @param name Optional object name to help for debugging
   */
  protected constructor(parent: FimObject, shader: FimShader, name?: string) {
    super(parent, name);

    shader.reparent(this);
    this.shader = shader;
  }

  /** The underlying `FimShader` object */
  public readonly shader: FimShader;

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return outputImage.executeAsync(this.shader, destCoords);
  }
}
