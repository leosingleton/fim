// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from './FimGLCanvas';
import { FimGLError } from './FimGLError';
import { IFimGLContextNotify } from './IFimGLContextNotify';
import { FimCanvas, FimGreyscaleBuffer, FimRgbaBuffer } from '../image';

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

export class FimGLTexture implements IFimGLContextNotify {
  constructor(glCanvas: FimGLCanvas, textureWidth?: number, textureHeight?: number, flags = FimGLTextureFlags.None) {
    glCanvas.registerObject(this);
    this.glCanvas = glCanvas;
    this.gl = glCanvas.gl;
    this.textureWidth = textureWidth ? textureWidth : glCanvas.w;
    this.textureHeight = textureHeight ? textureHeight : glCanvas.h;
    this.textureFlags = flags;

    // Mobile browsers may have limits as low as 4096x4096 for texture buffers. Images from cameras may actually exceed
    // WebGL's capabilities and need to be downscaled.
    let maxDimension = glCanvas.capabilities.maxTextureSize;
    if (this.textureWidth > maxDimension || this.textureHeight > maxDimension) {
      let scale = Math.min(maxDimension / this.textureWidth, maxDimension / this.textureHeight);
      this.textureWidth = Math.floor(this.textureWidth * scale);
      this.textureHeight = Math.floor(this.textureHeight * scale);
      console.log('Limiting WebGL texture to ' + this.textureWidth + 'x' + this.textureHeight);
    }

    this.onContextRestored();
  }

  public onContextRestored(): void {
    let gl = this.gl;

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
      gl.texImage2D(gl.TEXTURE_2D, 0, format, this.textureWidth, this.textureHeight, 0, format, colorDepth, null);
      FimGLError.throwOnError(gl);

      this.fb = gl.createFramebuffer();
      FimGLError.throwOnError(gl);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      FimGLError.throwOnError(gl);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      FimGLError.throwOnError(gl);
    }

    if (this.inputCanvas) {
      this.copyFromCanvas(this.inputCanvas);
    }
    if (this.inputBuffer) {
      this.copyFromRgbaBuffer(this.inputBuffer);
    }
  }

  public bind(textureUnit: number): void {
    let gl = this.gl;

    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    FimGLError.throwOnError(gl);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);    
    FimGLError.throwOnError(gl);
  }

  public copyFromCanvas(srcImage: FimCanvas): void {
    let gl = this.gl;

    this.inputCanvas = srcImage;

    this.bind(0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, srcImage.getCanvas());
    FimGLError.throwOnError(gl);
  }

  public copyFromGreyscaleBuffer(srcImage: FimGreyscaleBuffer): void {
    let gl = this.gl;

    //this.inputBuffer = srcImage;

    this.bind(0);
    let format = (this.textureFlags & FimGLTextureFlags.Greyscale) ? gl.LUMINANCE : gl.RGBA;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, this.textureWidth, this.textureHeight, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE,
      srcImage.getBuffer());
    FimGLError.throwOnError(gl);
  }

  public copyFromRgbaBuffer(srcImage: FimRgbaBuffer): void {
    let gl = this.gl;

    this.inputBuffer = srcImage;

    this.bind(0);
    let format = (this.textureFlags & FimGLTextureFlags.Greyscale) ? gl.LUMINANCE : gl.RGBA;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      srcImage.getBuffer());
    FimGLError.throwOnError(gl);
  }

  public onContextLost(): void {
    this.dispose();
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

  public getWidth(): number {
    return this.textureWidth;
  }

  public getHeight(): number {
    return this.textureHeight;
  }

  public getFramebuffer(): WebGLFramebuffer {
    return this.fb;
  }

  private glCanvas: FimGLCanvas;
  private gl: WebGLRenderingContext;
  private texture: WebGLTexture;
  private fb: WebGLFramebuffer;
  private textureWidth: number;
  private textureHeight: number;
  private textureFlags: FimGLTextureFlags;
  private inputCanvas: FimCanvas;
  private inputBuffer: FimRgbaBuffer;

  /**
   * Creates a new WebGL texture from a greyscale byte array
   * @param canvas WebGL context
   * @param srcImage Greyscale byte array
   * @param extraFlags Additional flags. EightBit, Greyscale, and InputOnly are always enabled for textures created via
   *    this function.
   */
  public static createFromGreyscaleBuffer(canvas: FimGLCanvas, srcImage: FimGreyscaleBuffer,
      extraFlags = FimGLTextureFlags.None): FimGLTexture {
    let flags = FimGLTextureFlags.EightBit | FimGLTextureFlags.Greyscale | FimGLTextureFlags.InputOnly | extraFlags;
    let texture = new FimGLTexture(canvas, srcImage.w, srcImage.h, flags);
    texture.copyFromGreyscaleBuffer(srcImage);
    return texture;
  }

  /**
   * Creates a new WebGL texture from an RGBA byte array
   * @param canvas WebGL context
   * @param srcImage RGBA byte array
   * @param extraFlags Additional flags. EightBit and InputOnly are always enabled for textures created via this
   *    function.
   */
  public static createFromRgbaBuffer(canvas: FimGLCanvas, srcImage: FimRgbaBuffer,
      extraFlags = FimGLTextureFlags.None): FimGLTexture {
    let flags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly | extraFlags;
    let texture = new FimGLTexture(canvas, srcImage.w, srcImage.h, flags);
    texture.copyFromRgbaBuffer(srcImage);
    return texture;
  }

  /**
   * Creates a new WebGL texture from a canvas
   * @param canvas WebGL context
   * @param srcImage Canvas to load onto the texture
   * @param extraFlags Additional flags. EightBit and InputOnly are always enabled for textures created via this
   *    function.
   */
  public static createFromCanvas(canvas: FimGLCanvas, srcImage: FimCanvas, extraFlags = FimGLTextureFlags.None):
      FimGLTexture {
    let flags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly | extraFlags;
    let texture = new FimGLTexture(canvas, srcImage.w, srcImage.h, flags);
    texture.copyFromCanvas(srcImage);
    return texture;
  }
}
