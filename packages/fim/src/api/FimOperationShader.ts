// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
import { FimImage } from './FimImage';
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
   * @param fim FIM instance
   * @param shader `FimShader` instance created by the derived class's constructor
   * @param objectName Optional object name to help for debugging
   */
  protected constructor(fim: Fim, shader: FimShader, objectName?: string) {
    super(fim, objectName);
    this.shader = shader;
    this.addChild(shader);
  }

  /** The underlying `FimShader` object */
  public readonly shader: FimShader;

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return outputImage.executeAsync(this.shader, destCoords);
  }
}
