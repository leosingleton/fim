// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLError, FimGLErrorCode } from '../FimGLError';
import { FimGLTexture, FimGLTextureFlags, FimGLTextureOptions, IFimGLTexture } from '../FimGLTexture';
import { FimCanvas } from '../../image/FimCanvas';
import { FimImage } from '../../image/FimImage';
import { FimGreyscaleBuffer } from '../../image/FimGreyscaleBuffer';
import { FimRgbaBuffer } from '../../image/FimRgbaBuffer';
import { FimRect } from '../../primitives/FimRect';

export interface IFimGLPreservedTexture extends IFimGLTexture {
  /** Gets the FimGLTexture to read/write from */
  getTexture(): IFimGLTexture;

  /**
   * Saves the current texture to a backing 2D canvas. If the WebGL context is lost, the texture will be automatically
   * restored from this point.
   */
  preserve(): void;
}

/**
 * When the WebGL context is lost, so is any data that may be held in WebGL textures. This class creates a texture that
 * is also backed by in-memory storage on a 2D canvas, so the texture contents can be recreated once the context is
 * restored.
 */
export class FimGLPreservedTexture extends FimImage implements IFimGLPreservedTexture {
  /**
   * Creates a WebGL texture whose contents are preserved even if the WebGL context is lost
   * @param glCanvas FimGLCanvas to which this texture belongs
   * @param width Texture width, in pixels
   * @param height Texture height, in pixels
   * @param channels Number of channels
   * @param bpp Bits per pixel. Note that the constructor may choose a lower quality than requested, depending on the
   *    browser and GPU's WebGL capabilities and the current performance.
   * @param options See FimGLTextureOptions
   */
  public constructor(glCanvas: FimGLCanvas, width?: number, height?: number, options?: FimGLTextureOptions) {
    // Default parameters
    width = width || glCanvas.w;
    height = height || glCanvas.h;

    // Do not allow the AllowLargerThanCanvas flag, as we must use the canvas to preserve the texture
    if (options && options.textureFlags && (options.textureFlags & FimGLTextureFlags.AllowLargerThanCanvas) !== 0) {
      throw new FimGLError(FimGLErrorCode.AppError, 'NoAllowLargerThanCanvas');
    }

    // Create the WebGL texture according to the requested options
    let texture = new FimGLTexture(glCanvas, width, height, options);

    // Call the FimImage constructor. We'll figure out the maxDimension property based on the texture's dimensions.
    super(width, height, Math.max(texture.realDimensions.w, texture.realDimensions.h));
    this.glCanvas = glCanvas;
    this.texture = texture;
    this.textureOptions = texture.textureOptions;
  
    // The texture may have been downscaled because of GPU limits. Create a backing canvas of the actual size.
    this.backingCanvas = new FimCanvas(texture.realDimensions.w, texture.realDimensions.h, null,
      glCanvas.offscreenCanvasFactory);

    // Register for context lost notifications
    glCanvas.registerForContextLost(() => {
      if (this.texture) {
        this.texture.dispose();
        delete this.texture;
      }
    });
  }

  // IFimDimensions implementation
  public readonly w: number;
  public readonly h: number;
  public readonly dimensions: FimRect;

  public dispose(): void {
    if (this.texture) {
      this.texture.dispose();
      delete this.texture;
    }
    if (this.backingCanvas) {
      this.backingCanvas.dispose();
      delete this.backingCanvas;
    }
  }

  /** Gets the FimGLTexture to read/write from */
  public getTexture(): FimGLTexture {
    let glCanvas = this.glCanvas;

    // Ensure the WebGL context is not currently lost
    if (glCanvas.isContextLost()) {
      throw new FimGLError(FimGLErrorCode.ContextLost);
    }

    if (!this.texture) {
      // The context was lost but has been restored. Recreate the texture.
      let texture = new FimGLTexture(glCanvas, this.w, this.h, this.textureOptions);
      texture.copyFrom(this.backingCanvas);
      this.texture = texture;
    }

    return this.texture;
  }

  public preserve(): void {
    let texture = this.texture;
    let glCanvas = this.glCanvas;

    // Calculate the destination coordinates on the WebGL canvas. This is tricky, because (1) the canvas may be larger
    // than the texture and (2) the canvas may be downscaled and copyFrom does not honor the real coordinates. We don't
    // worry about destRect ever being larger than the canvas, as we suppressed the AllowLargerThanCanvas flag in the
    // constructor.
    let glRect = texture.realDimensions.rescale(1 / glCanvas.downscaleRatio);

    // Copy the texture to the 2D backing canvas. This takes two steps, as we copy to the WebGL canvas first.
    glCanvas.copyFrom(texture, null, glRect);
    this.backingCanvas.copyFrom(glCanvas, glRect);
  }

  private texture: FimGLTexture;
  private backingCanvas: FimCanvas;

  // Settings for re-creating the texture
  private glCanvas: FimGLCanvas;
  public readonly textureOptions: FimGLTextureOptions;

  //
  // The remainder of this class just duplicates FimGLTexture methods so the two can be used interchangeably
  //

  public copyFrom(srcImage: FimCanvas | FimGLCanvas | FimGreyscaleBuffer | FimRgbaBuffer, srcCoords?: FimRect,
      destCoords?: FimRect): void {
    this.getTexture().copyFrom(srcImage, srcCoords, destCoords);
  }

  public copyTo(destImage: FimGLCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    destImage.copyFrom(this, srcCoords, destCoords);
  }

  public isSquarePot() {
    return this.getTexture().isSquarePot();
  }
}
