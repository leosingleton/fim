// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from './FimGLCanvas';
import { FimGLError } from './FimGLError';
import { FimCanvas, FimGreyscaleBuffer, FimImage, FimRgbaBuffer, FimImageKind, FimImageKindGLTexture,
  FimImageKindCanvas, FimImageKindGLCanvas, FimImageKindGreyscaleBuffer, FimImageKindRgbaBuffer } from '../image';
import { FimRect } from '../primitives';

/** Flags for FimGLTexture creation */
export const enum FimGLTextureFlags {
  /** Default value */
  None = 0,

  /** Makes the texture a single greyscale channel */
  Greyscale = (1 << 0),

  /**
   * Limits the color depth to 8-bit, regardless of the render's maximum quality. This is useful when loading a texture
   * from an 8-bit image, and greater color depth will not yield any additional quality.
   */
  EightBit = (1 << 1),

  /** By default, we use nearest sampling. This uses linear instead. */
  LinearSampling = (1 << 2),

  /** By default, we clamp the pixels at the edge. This causes us to repeat the image instead. */
  Repeat = (1 << 3),

  /**
   * If set, we do not create a framebuffer for this texture. Thus, programs are unable to write to it. This is only
   * useful when loading an input texture as read-only.
   */
  InputOnly = (1 << 4)
}

/** Wrapper class for WebGL textures */
export class FimGLTexture extends FimImage {
  public readonly kind: FimImageKind;

  /**
   * Creates a WebGL texture
   * @param glCanvas FimGLCanvas to which this texture belongs
   * @param width Texture width, in pixels
   * @param height Texture height, in pixels
   * @param flags See FimGLTextureFlags
   */
  constructor(glCanvas: FimGLCanvas, width? : number, height?: number, flags = FimGLTextureFlags.None) {
    // Default values
    width = width || glCanvas.w;
    height = height || glCanvas.h;

    // Mobile browsers may have limits as low as 4096x4096 for texture buffers. Large images, such as those from
    // cameras may actually exceed WebGL's capabilities and need to be downscaled.
    let maxDimension = glCanvas.capabilities.maxTextureSize;
    if (width > maxDimension || height > maxDimension) {
      let scale = Math.min(maxDimension / width, maxDimension / height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
      console.log('Limiting WebGL texture to ' + width + 'x' + height);
    }

    super(width, height);
    this.kind = FimImageKindGLTexture;

    let gl = this.gl = glCanvas.gl;
    this.glCanvas = glCanvas;
    this.textureFlags = flags;

    // Create a texture
    this.texture = gl.createTexture();
    FimGLError.throwOnError(gl);
    this.bind(0);
    
    // Set the parameters so we can render any size image
    let clamp = (this.textureFlags & FimGLTextureFlags.Repeat) ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, clamp);
    FimGLError.throwOnError(gl);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, clamp);
    FimGLError.throwOnError(gl);

    let filter = (this.textureFlags & FimGLTextureFlags.LinearSampling) ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    FimGLError.throwOnError(gl);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    FimGLError.throwOnError(gl);

    // If width and height are specified, create a framebuffer to back this texture
    if ((this.textureFlags & FimGLTextureFlags.InputOnly) === 0) {
      let format = (this.textureFlags & FimGLTextureFlags.Greyscale) ? gl.LUMINANCE : gl.RGBA;
      let colorDepth = (this.textureFlags & FimGLTextureFlags.EightBit) ? gl.UNSIGNED_BYTE :
        this.glCanvas.getMaxTextureDepthValue();
      gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, colorDepth, null);
      FimGLError.throwOnError(gl);

      this.fb = gl.createFramebuffer();
      FimGLError.throwOnError(gl);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      FimGLError.throwOnError(gl);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      FimGLError.throwOnError(gl);
    }
  }

  public bind(textureUnit: number): void {
    let gl = this.gl;

    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    FimGLError.throwOnError(gl);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);    
    FimGLError.throwOnError(gl);
  }

  /**
   * Copies image from another. Neither cropping nor rescaling is supported.
   * @param srcImage Source image
   * @param srcCoords Provided for consistency with other copyFrom() functions. Must be undefined.
   * @param destCoords Provided for consistency with other copyFrom() functions. Must be undefined.
   */
  public copyFrom(srcImage: FimCanvas | FimGLCanvas | FimGreyscaleBuffer | FimRgbaBuffer, srcCoords?: FimRect,
      destCoords?: FimRect): void {
    // Coordinates are purely for consistency with other classes' copyFrom() functions. Throw an error if they're
    // actually used.
    if (srcCoords || destCoords) {
      throw new Error('Coords not supported');
    }

    switch (srcImage.kind) {
      case FimImageKindCanvas:
      case FimImageKindGLCanvas:
        return this.copyFromCanvas(srcImage);

      case FimImageKindGreyscaleBuffer:
        return this.copyFromGreyscaleBuffer(srcImage);

      case FimImageKindRgbaBuffer:
        return this.copyFromRgbaBuffer(srcImage);

      default:
        this.throwOnInvalidImageKind(srcImage);
    }
  }
  
  private copyFromCanvas(srcImage: FimCanvas | FimGLCanvas): void {
    let gl = this.gl;

    this.bind(0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, srcImage.getCanvas());
    FimGLError.throwOnError(gl);
  }

  private copyFromGreyscaleBuffer(srcImage: FimGreyscaleBuffer): void {
    let gl = this.gl;

    this.bind(0);
    let format = (this.textureFlags & FimGLTextureFlags.Greyscale) ? gl.LUMINANCE : gl.RGBA;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, srcImage.w, srcImage.h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE,
      new Uint8Array(srcImage.getBuffer()));
    FimGLError.throwOnError(gl);
  }

  private copyFromRgbaBuffer(srcImage: FimRgbaBuffer): void {
    let gl = this.gl;

    this.bind(0);
    let format = (this.textureFlags & FimGLTextureFlags.Greyscale) ? gl.LUMINANCE : gl.RGBA;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, srcImage.w, srcImage.h, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array(srcImage.getBuffer()));
    FimGLError.throwOnError(gl);
  }

  public dispose(): void {
    let gl = this.gl;

    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = undefined;
      FimGLError.throwOnError(gl);
    }

    if (this.fb) {
      gl.deleteFramebuffer(this.fb);
      this.fb = undefined;
      FimGLError.throwOnError(gl);
    }

    this.gl = undefined;
  }

  public getFramebuffer(): WebGLFramebuffer {
    return this.fb;
  }

  private glCanvas: FimGLCanvas;
  private gl: WebGLRenderingContext;
  private texture: WebGLTexture;
  private fb: WebGLFramebuffer;
  private textureFlags: FimGLTextureFlags;

  /**
   * Creates a new WebGL texture from another image
   * @param canvas WebGL context
   * @param srcImage Source image
   * @param extraFlags Additional flags. InputOnly is always enabled for textures created via this function. EightBit
   *    and/or Greyscale may also be automatically set depending on the type of srcImage.
   */
  public static createFrom(canvas: FimGLCanvas, srcImage: FimGreyscaleBuffer | FimRgbaBuffer | FimCanvas | FimGLCanvas,
      extraFlags = FimGLTextureFlags.None): FimGLTexture {
    // Calculate flags with defaults and extras
    let flags = FimGLTextureFlags.InputOnly | extraFlags;
    if (srcImage.kind === FimImageKindGreyscaleBuffer) {
      flags |= FimGLTextureFlags.Greyscale;
    }
    if (srcImage.kind !== FimImageKindGLCanvas) {
      flags |= FimGLTextureFlags.EightBit;
    }

    let texture = new FimGLTexture(canvas, srcImage.w, srcImage.h, flags);
    texture.copyFrom(srcImage);
    return texture;
  }
}
