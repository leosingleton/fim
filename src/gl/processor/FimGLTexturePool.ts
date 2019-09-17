// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IFimGLCanvas } from '../FimGLCanvas';
import { FimGLTexture, FimGLTextureOptions, IFimGLTexture } from '../FimGLTexture';
import { ResourcePool } from '@leosingleton/commonlibs';

/** Pool of temporary textures */
export class FimGLTexturePool extends ResourcePool<IFimGLTexture> {
  /**
   * Constructor
   * @param canvas FimGLCanvas from which the textures will be created
   */
  public constructor(canvas: IFimGLCanvas) {
    super();
    this.glCanvas = canvas;
  }

  /**
   * Gets a texture from the texture pool
   * 
   * @param width Texture width, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param height Texture height, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param options See FimGLTextureOptions
   */
  public getTexture(width?: number, height?: number, options?: FimGLTextureOptions):
      IFimGLTexture {
    let id = FimGLTexture.describeTexture(this.glCanvas, width, height, options);
    return this.getOrCreateObject(id, () => this.glCanvas.createTexture(width, height, options));
  }

  public readonly glCanvas: IFimGLCanvas;
}
