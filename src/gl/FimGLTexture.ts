// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from './FimGLCanvas';
import { FimGLCapabilities } from './FimGLCapabilities';
import { FimGLError, FimGLErrorCode } from './FimGLError';
import { FimCanvas } from '../image/FimCanvas';
import { FimGreyscaleBuffer } from '../image/FimGreyscaleBuffer';
import { FimImage } from '../image/FimImage';
import { FimRgbaBuffer } from '../image/FimRgbaBuffer';
import { FimBitsPerPixel, FimColorChannels, FimRect } from '../primitives';
import { using } from '@leosingleton/commonlibs';

/** Flags for FimGLTexture creation */
export const enum FimGLTextureFlags {
  /** Default value */
  None = 0,

  /** By default, we use nearest sampling. This uses linear instead. */
  LinearSampling = (1 << 0),

  /**
   * By default, we clamp the pixels at the edge. This causes us to repeat the image instead.
   * NOTE: Only available on square power-of-two textures!
   */
  Repeat = (1 << 1),

  /**
   * If set, we do not create a framebuffer for this texture. Thus, programs are unable to write to it. This is only
   * useful when loading an input texture as read-only.
   */
  InputOnly = (1 << 2)
}

/** Options for FimGLTexture constructor */
export interface FimGLTextureOptions {
  /** Number of channels. Default is RGBA (4). */
  channels?: FimColorChannels;

  /** Bits per pixel. Default is 32. */
  bpp?: FimBitsPerPixel;

  /** Flags */
  flags?: FimGLTextureFlags;
}

/** Wrapper class for WebGL textures */
export class FimGLTexture extends FimImage {
  /**
   * Creates a WebGL texture
   * @param glCanvas FimGLCanvas to which this texture belongs
   * @param width Texture width, in pixels
   * @param height Texture height, in pixels
   * @param channels Number of channels
   * @param bpp Bits per pixel. Note that the constructor may choose a lower quality than requested, depending on the
   *    browser and GPU's WebGL capabilities and the current performance.
   * @param flags See FimGLTextureFlags
   */
  constructor(glCanvas: FimGLCanvas, width?: number, height?: number, options?: FimGLTextureOptions) {
    // Default values
    width = width || glCanvas.w;
    height = height || glCanvas.h;

    // Mobile browsers may have limits as low as 4096x4096 for texture buffers. Large images, such as those from
    // cameras may actually exceed WebGL's capabilities and need to be downscaled.
    let maxDimension = FimGLCapabilities.getCapabilities().maxTextureSize;

    // Call the parent constructor. We re-read the dimensions as they may get downscaled.
    super(width, height, maxDimension);
    width = this.w;
    height = this.h;

    let bpp = options ? options.bpp : FimBitsPerPixel.BPP8;
    let flags = this.textureFlags = options ? options.flags : FimGLTextureFlags.None;
    let depth = glCanvas.getTextureDepth(bpp, (flags & FimGLTextureFlags.LinearSampling) !== 0);
    this.bpp = depth.bpp;
    this.hasImage = false;

    // Most GPUs do not support rendering to a greyscale texture. There doesn't seem to be a capability to detect it,
    // so just use an RGBA one instead if the texture is not flagged InputOnly.
    if (options && (flags & FimGLTextureFlags.InputOnly) === 0) {
      options.channels = null;
    }
    this.channels = options ? options.channels : FimColorChannels.RGBA;

    let gl = this.gl = glCanvas.gl;
    this.glCanvas = glCanvas;

    // Create a texture
    let texture = gl.createTexture();
    FimGLError.throwOnError(gl);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    FimGLError.throwOnError(gl);

    try {    
      // Set the parameters so we can render any size image
      if ((flags & FimGLTextureFlags.Repeat) && !this.isSquarePot()) {
        // WebGL only supports non CLAMP_TO_EDGE texture wrapping with square power-of-two textures
        throw new FimGLError(FimGLErrorCode.AppError, 'TextureWrapNonSquarePot');
      }
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
        // Allocate the texture
        let format = this.getGLFormat();
        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, depth.glConstant, null);
        FimGLError.throwOnError(gl);

        // Create the framebuffer
        this.fb = gl.createFramebuffer();
        FimGLError.throwOnError(gl);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        FimGLError.throwOnError(gl);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        FimGLError.throwOnError(gl);

        // Check the framebuffer status
        FimGLError.throwOnFrameBufferStatus(gl, gl.FRAMEBUFFER);
      }

      this.texture = texture;
    } finally {
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  public bind(textureUnit: number): void {
    this.bindInternal(textureUnit, this.texture);
  }

  public unbind(textureUnit: number): void {
    this.bindInternal(textureUnit, null);
  }

  private bindInternal(textureUnit: number, texture: WebGLTexture): void {
    let gl = this.gl;

    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    FimGLError.throwOnError(gl);
    gl.bindTexture(gl.TEXTURE_2D, texture);    
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
      throw new FimGLError(FimGLErrorCode.AppError, 'Coords not supported');
    }

    // WebGL's texImage2D() will normally rescale an input image to the texture dimensions. However, if the input image
    // is greater than the maximum texture size, it returns an InvalidValue error. To avoid this, we'll explicitly
    // downscale larger images for WebGL.
    let maxDimension = FimGLCapabilities.getCapabilities().maxTextureSize;
    if (srcImage.w > maxDimension || srcImage.h > maxDimension) {
      return this.copyFromWithDownscale(srcImage);
    }

    if (srcImage instanceof FimCanvas || srcImage instanceof FimGLCanvas) {
      this.copyFromCanvas(srcImage);
    } else if (srcImage instanceof FimGreyscaleBuffer) {
      this.copyFromGreyscaleBuffer(srcImage);
    } else if (srcImage instanceof FimRgbaBuffer) {
      this.copyFromRgbaBuffer(srcImage);
    } else {
      this.throwOnInvalidImageKind(srcImage);
    }
  }
  
  private copyFromCanvas(srcImage: FimCanvas | FimGLCanvas): void {
    let gl = this.gl;

    this.bind(0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, srcImage.getCanvas());
    FimGLError.throwOnError(gl);
    this.unbind(0);

    this.hasImage = true;
  }

  private copyFromGreyscaleBuffer(srcImage: FimGreyscaleBuffer): void {
    let gl = this.gl;

    this.bind(0);
    let format = this.getGLFormat();
    gl.texImage2D(gl.TEXTURE_2D, 0, format, srcImage.w, srcImage.h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE,
      new Uint8Array(srcImage.getBuffer()));
    FimGLError.throwOnError(gl);
    this.unbind(0);

    this.hasImage = true;
  }

  private copyFromRgbaBuffer(srcImage: FimRgbaBuffer): void {
    let gl = this.gl;

    this.bind(0);
    let format = this.getGLFormat();
    gl.texImage2D(gl.TEXTURE_2D, 0, format, srcImage.w, srcImage.h, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array(srcImage.getBuffer()));
    FimGLError.throwOnError(gl);
    this.unbind(0);

    this.hasImage = true;
  }

  private copyFromWithDownscale(srcImage: FimCanvas | FimGLCanvas | FimGreyscaleBuffer | FimRgbaBuffer): void {
    if (srcImage instanceof FimGreyscaleBuffer) {
      // This code path needs to be optimized, but it will likely rarely, if ever, get used. FimGreyscaleBuffer
      // doesn't support resizing, nor does FimCanvas support copyFrom() a FimGreyscaleBuffer. So, we do multiple
      // steps:
      //  1. FimGreyscaleBuffer => FimRgbaBuffer
      //  2. FimRgbaBuffer => Downscale => FimCanvas (using the slower, non-async version)
      //  3. FimCanvas => FimTexture
      using(new FimRgbaBuffer(srcImage.w, srcImage.h), temp => {
        temp.copyFrom(srcImage);
        this.copyFrom(temp);
      });
    } else {
      // For all other object types, downscale to a FimCanvas of the target texture dimensions
      using(new FimCanvas(this.w, this.h), temp => {
        temp.copyFrom(srcImage);
        this.copyFrom(temp);
      });
    }
  }

  public dispose(): void {
    let gl = this.gl;

    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = undefined;
    }

    if (this.fb) {
      gl.deleteFramebuffer(this.fb);
      this.fb = undefined;
    }

    this.gl = undefined;
  }

  public getFramebuffer(): WebGLFramebuffer {
    if (this.textureFlags & FimGLTextureFlags.InputOnly) {
      // Cannot write to an input only texture
      throw new FimGLError(FimGLErrorCode.AppError, 'InputOnly');
    }
    return this.fb;
  }

  /**
   * Returns whether the dimensions of this texture are a square power-of-two. Certain WebGL features, like texture
   * wrapping, are only available on textures with square power-of-two dimensions.
   */
  public isSquarePot(): boolean {
    return ((this.w & (this.w - 1)) === 0) && ((this.h & (this.h - 1)) === 0);
  }

  /** See FimGLTextureFlags */
  public readonly textureFlags: FimGLTextureFlags;

  /** Color channels */
  public readonly channels: FimColorChannels;

  /** Bits per pixel */
  public readonly bpp: FimBitsPerPixel;

  /** Returns the WebGL constant for the texture's format */
  private getGLFormat(): number {
    let gl = this.gl;
    return (this.channels === FimColorChannels.Greyscale) ? gl.LUMINANCE : gl.RGBA;
  }

  /**
   * Boolean indicating whether this texture has an image. Set to true by any of the copyFrom() calls, or by using this
   * texture as the output of a FimGLProgram.
   */
  public hasImage: boolean;

  private glCanvas: FimGLCanvas;
  private gl: WebGLRenderingContext;
  private texture: WebGLTexture;
  private fb: WebGLFramebuffer;

  /**
   * Creates a new WebGL texture from another image
   * @param canvas WebGL context
   * @param srcImage Source image
   * @param extraFlags Additional flags. InputOnly is always enabled for textures created via this function.
   */
  public static createFrom(canvas: FimGLCanvas, srcImage: FimGreyscaleBuffer | FimRgbaBuffer | FimCanvas | FimGLCanvas,
      extraFlags = FimGLTextureFlags.None): FimGLTexture {
    // Calculate parameters with defaults and extras
    let channels = (srcImage instanceof FimGreyscaleBuffer) ? FimColorChannels.Greyscale : FimColorChannels.RGBA;
    let bpp = FimBitsPerPixel.BPP8;
    let flags = FimGLTextureFlags.InputOnly | extraFlags;

    let texture = new FimGLTexture(canvas, srcImage.w, srcImage.h, { channels, bpp, flags });
    texture.copyFrom(srcImage);
    return texture;
  }
}
