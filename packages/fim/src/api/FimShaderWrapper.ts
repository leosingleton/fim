// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
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
   * @param fim FIM instance
   * @param shader `FimShader` instance created by the derived class's constructor
   * @param objectName Optional object name to help for debugging
   */
  protected constructor(fim: Fim, shader: FimShader, objectName?: string) {
    objectName = objectName ?? 'Wrapper';
    this.handle = `${shader.handle}/${objectName}`;
    this.fim = fim;
    this.shader = shader;

    // Register ourselves with the parent to receive releaseResources() and dispose() calls
    fim.registerChildObject(this);
  }

  public readonly handle: string;

  /** The parent FIM instance */
  private readonly fim: Fim;

  /** The underlying `FimShader` object */
  public readonly shader: FimShader;

  public releaseResources(flags: FimReleaseResourcesFlags): void {
    // Release shader resources. This may result in duplicate calls to shader, as it also receives notifications from
    // the parent FIM instance if it was sent there and not directly to this wrapper object first. However,
    // releaseResources() is idempotent so multiple calls have no impact.
    this.shader.releaseResources(flags);
  }

  public releaseAllResources(): void {
    // Release shader resources. This may result in duplicate calls to shader, as it also receives notifications from
    // the parent FIM instance if it was sent there and not directly to this wrapper object first. However,
    // releaseResources() is idempotent so multiple calls have no impact.
    this.shader.releaseAllResources();
  }

  /** Set to `true` on the first call to `dispose()` */
  private isDisposed = false;

  public dispose() {
    const me = this;

    if (me.isDisposed) {
      FimError.throwOnObjectDisposed(me.shader.handle);
    } else {
      // Dispose ourselves
      try {
        me.shader.dispose();
      } catch {
        // If the dispose() was triggered from the parent FIM object, shader.dispose() may get called twice--once from
        // the parent FIM object and once here. The second call throws an exception because the shader was already
        // disposed. I should probably come up with a better way to handle this rather than catching and ignoring the
        // exception...
      }
      me.isDisposed = true;

      // Stop receiving notifications from the parent
      me.fim.unregisterChildObject(this);
    }
  }
}
