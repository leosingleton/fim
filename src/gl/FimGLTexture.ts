// src/fim/GLTexture.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>

import { FimGLCanvas } from './GLCanvas';
import { FimGLObject } from './GLObject';
import { FimReadOnlyCanvas } from './ReadOnlyCanvas';
import { FimGLError } from './GLError';
import { FimImageData } from './ImageData';

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

export class FimGLTexture implements FimGLObject {
  constructor(glCanvas: FimGLCanvas, textureWidth?: number, textureHeight?: number, flags = FimGLTextureFlags.None) {
    glCanvas.registerObject(this);
    this.glCanvas = glCanvas;
    this.gl = glCanvas.getGLContext();
    this.textureWidth = textureWidth ? textureWidth : glCanvas.getWidth();
    this.textureHeight = textureHeight ? textureHeight : glCanvas.getHeight();
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
      this.loadCanvas(this.inputCanvas);
    }
    if (this.inputData) {
      this.loadRaw(this.inputData);
    }
  }

  public bind(textureUnit: number): void {
    let gl = this.gl;

    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    FimGLError.throwOnError(gl);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);    
    FimGLError.throwOnError(gl);
  }

  public loadCanvas(inputCanvas: FimReadOnlyCanvas): void {
    let gl = this.gl;

    this.inputCanvas = inputCanvas;

    this.bind(0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, inputCanvas.getCanvasReadOnly());
    FimGLError.throwOnError(gl);
  }

  public loadRaw(inputData: Uint8Array): void {
    let gl = this.gl;

    this.inputData = inputData;

    this.bind(0);
    let format = (this.textureFlags & FimGLTextureFlags.Greyscale) ? gl.LUMINANCE : gl.RGBA;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, this.textureWidth, this.textureHeight, 0, format, gl.UNSIGNED_BYTE,
      inputData);
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
  private inputCanvas: FimReadOnlyCanvas;
  private inputData: Uint8Array;

  /**
   * Creates a new WebGL texture from decompressed JPEG data
   * @param canvas WebGL context
   * @param imageData Decompressed JPEG data
   * @param extraFlags Additional flags. EightBit and InputOnly are always enabled for textures created via this
   *    function.
   */
  public static createFromData(canvas: FimGLCanvas, imageData: FimImageData, extraFlags = FimGLTextureFlags.None):
      FimGLTexture {
    let flags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly | extraFlags;
    let texture = new FimGLTexture(canvas, imageData.imageWidth, imageData.imageHeight, flags);
    texture.loadRaw(imageData.imageData);
    return texture;
  }

  /**
   * Creates a new WebGL texture from a canvas
   * @param canvas WebGL context
   * @param image Canvas to load onto the texture
   * @param extraFlags Additional flags. EightBit and InputOnly are always enabled for textures created via this
   *    function.
   */
  public static createFromCanvas(canvas: FimGLCanvas, image: FimReadOnlyCanvas, extraFlags = FimGLTextureFlags.None):
      FimGLTexture {
    let flags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly | extraFlags;
    let texture = new FimGLTexture(canvas, image.getWidth(), image.getHeight(), flags);
    texture.loadCanvas(image);
    return texture;
  }
}
