// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';
import { FimObject } from './FimObject';
import { FimOperation } from './FimOperation';
import { FimShader } from './FimShader';
import { FimRect } from '../primitives/FimRect';
import { GlslShader } from 'webpack-glsl-minify';

/**
 * Base class for building FIM operations out of a single WebGL shader. Derived classes may include the shader's source
 * code, instantiate it in the constructor, and add helper functions that set constants and uniforms.
 */
export abstract class FimOperationShader extends FimOperation {
  /**
   * Constructor
   * @param parent Parent object
   * @param fragmentShader Fragment shader, created using webpack-glsl-minify
   * @param vertexShader Optional vertex shader, created using webpack-glsl-minify
   * @param name Optional shader name, for debugging
   */
  protected constructor(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader, name?: string) {
    super(parent, name);
    this.shader = this.rootObject.createGLShader(fragmentShader, vertexShader, name, this);
  }

  /** The underlying `FimShader` object */
  public readonly shader: FimShader;

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return outputImage.executeAsync(this.shader, destCoords);
  }
}
