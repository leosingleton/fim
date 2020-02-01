// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLTexture, FimGLTextureOptions } from '../FimGLTexture';
import { FimColor } from '../../primitives/FimColor';
import { ResourcePool } from '@leosingleton/commonlibs';

/** Pool of temporary textures */
export class FimGLTexturePool extends ResourcePool<FimGLTexture> {
  /**
   * Constructor
   * @param canvas FimGLCanvas from which the textures will be created
   */
  public constructor(canvas: FimGLCanvas) {
    super();
    this.glCanvas = canvas;
  }

  /**
   * Gets a texture from the texture pool
   *
   * @param width Texture width, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param height Texture height, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param options See FimGLTextureOptions
   * @param initialColor If specified, the texture is initalized to this color
   */
  public getTexture(width?: number, height?: number, options?: FimGLTextureOptions,
      initialColor?: FimColor | string): FimGLTexture {
    const id = FimGLTexture.describeTexture(this.glCanvas, width, height, options);
    const texture = this.getOrCreateObject(id, () => this.glCanvas.createTexture(width, height, options));

    if (initialColor) {
      texture.fillTexture(initialColor);
    }

    return texture;
  }

  public readonly glCanvas: FimGLCanvas;
}
