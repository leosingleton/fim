// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLTexture, FimGLTextureOptions } from '../FimGLTexture';

/**
 * Performance testing shows that some browser/GPU combinations benefit significantly from reusing textures and calling
 * texImage2D() to update their contents, as opposed to creating and destroying the texture every time.
 * 
 * This class wraps FimGLTexture, overriding its dispose() method, so it can be returned to a pool and reused, rather
 * than being destroyed.
 */
export class FimGLTemporaryTexture extends FimGLTexture {
  /**
   * Creates a WebGL texture
   * @param disposeLambda Lambda called on dispose() instead of FimGLTexture's actual dispose() method
   * @param glCanvas FimGLCanvas to which this texture belongs
   * @param width Texture width, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param height Texture height, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param options See FimGLTextureOptions
   */
  public constructor(disposeLambda: () => void, glCanvas: FimGLCanvas, width?: number, height?: number,
      options?: FimGLTextureOptions) {
    super(glCanvas, width, height, options);
    this.disposeLambda = disposeLambda;
  }

  public dispose(): void {
    this.disposeLambda();
  }

  /**
   * Since dispose() has been overridden, this exposes the underlying dispose() method when we're actually ready to
   * free the texture.
   */
  public realDispose(): void {
    super.dispose();
  }

  private disposeLambda: () => void;
}
