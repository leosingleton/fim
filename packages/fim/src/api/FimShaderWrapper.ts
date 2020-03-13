// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObject } from './FimObject';
import { FimReleaseResourcesFlags } from './FimReleaseResourcesFlags';
import { FimShader } from './FimShader';
import { FimError } from '../primitives/FimError';

/**
 * Base class for wrappers around FIM shaders. Wrapper classes can contain shader source code to make them easier to
 * instantiate, and add helpers that make it easier to set the constants, uniforms, and vertices.
 */
export abstract class FimShaderWrapper implements FimObject {
  /**
   * Constructor
   * @param shader `FimShader` instance created by the derived class's constructor
   */
  protected constructor(shader: FimShader) {
    this.shader = shader;
  }

  public readonly handle: string;

  /** The underlying `FimShader` object */
  public readonly shader: FimShader;

  public releaseResources(flags: FimReleaseResourcesFlags): void {
    this.shader.releaseResources(flags);
  }

  public releaseAllResources(): void {
    this.shader.releaseAllResources();
  }

  /** Set to `true` on the first call to `dispose()` */
  private isDisposed = false;

  public dispose() {
    const me = this;

    if (me.isDisposed) {
      FimError.throwOnObjectDisposed(me.shader.handle);
    } else {
      me.shader.dispose();
      me.isDisposed = true;
    }
  }
}
