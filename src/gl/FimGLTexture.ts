// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas, IFimGLCanvas } from './FimGLCanvas';
import { FimGLCapabilities } from './FimGLCapabilities';
import { FimGLError, FimGLErrorCode } from './FimGLError';
import { FimConfig } from '../debug/FimConfig';
import { FimObjectType, recordCreate, recordDispose, recordTexImage2D } from '../debug/FimStats';
import { FimCanvas, IFimCanvas } from '../image/FimCanvas';
import { FimGreyscaleBuffer, IFimGreyscaleBuffer } from '../image/FimGreyscaleBuffer';
import { FimImage, IFimImage } from '../image/FimImage';
import { FimRgbaBuffer, IFimRgbaBuffer } from '../image/FimRgbaBuffer';
import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimColorChannels } from '../primitives/FimColorChannels';
import { FimRect } from '../primitives/FimRect';
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
  InputOnly = (1 << 2),

  /**
   * Although in WebGL, it is typical for a texture to be larger than the canvas, it doesn't usually make sense when
   * using the GPU to do 2D image processing. By default, we automatically downscale textures to the canvas dimensions
   * unless this flag is set.
   */
  AllowLargerThanCanvas = (1 << 3)
}

/** Options for FimGLTexture constructor */
export interface FimGLTextureOptions {
  /** Number of channels. Default is RGBA (4). */
  channels?: FimColorChannels;

  /**
   * Bits per pixel. Default is 32. Note that the constructor may choose a lower quality than requested, depending on
   * the browser and GPU's WebGL capabilities and the current performance.
   */
  bpp?: FimBitsPerPixel;

  /** Flags */
  textureFlags?: FimGLTextureFlags;
}

/** Wrapper for WebGL textures */
export interface IFimGLTexture extends IFimImage {
  /** The FimGLCanvas object which was used to create this texture */
  readonly glCanvas: IFimGLCanvas;

  /** See FimGLTextureOptions */
  readonly textureOptions: FimGLTextureOptions;

  /**
   * Copies image from another. Neither cropping nor rescaling is supported.
   * @param srcImage Source image
   * @param srcCoords Provided for consistency with other copyFrom() functions. Must be undefined.
   * @param destCoords Provided for consistency with other copyFrom() functions. Must be undefined.
   */
  copyFrom(srcImage: IFimCanvas | IFimGLCanvas | IFimGreyscaleBuffer | IFimRgbaBuffer, srcCoords?: FimRect,
    destCoords?: FimRect): void;

  /**
   * Copies to a WebGL canvas. Supports both cropping and rescaling.
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  copyTo(destImage: IFimGLCanvas, srcCoords?: FimRect, destCoords?: FimRect): void;

  /** Returns the underlying WebGL framebuffer backing this texture */
  getFramebuffer(): WebGLFramebuffer;

  /**
   * Returns whether the dimensions of this texture are a square power-of-two. Certain WebGL features, like texture
   * wrapping, are only available on textures with square power-of-two dimensions.
   */
  isSquarePot(): boolean;
}

/** Wrapper class for WebGL textures */
export class FimGLTexture extends FimImage implements IFimGLTexture {
  /**
   * Creates a WebGL texture
   * @param glCanvas FimGLCanvas to which this texture belongs
   * @param width Texture width, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param height Texture height, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param options See FimGLTextureOptions
   */
  constructor(glCanvas: FimGLCanvas, width?: number, height?: number, options?: FimGLTextureOptions) {
    let fim = glCanvas.fim;
    let originalOptions = options;

    // Default values
    width = width || glCanvas.w;
    height = height || glCanvas.h;
    options = FimGLTexture.applyDefaults(options);

    // Mobile browsers may have limits as low as 4096x4096 for texture buffers. Large images, such as those from
    // cameras may actually exceed WebGL's capabilities and need to be downscaled.
    let maxDimension = FimGLCapabilities.getCapabilities(fim).maxTextureSize;

    // If a lower texture size limit was set for debugging, use that instead
    let debugMaxDimension = FimConfig.config.maxGLTextureSize;
    if (debugMaxDimension > 0) {
      maxDimension = Math.min(maxDimension, debugMaxDimension);
    }
    
    // Downscale the texture to fit on the WebGL canvas
    if ((options.textureFlags & FimGLTextureFlags.AllowLargerThanCanvas) === 0) {
      if (width > glCanvas.w || height > glCanvas.h) {
        let maxRect = FimRect.fromWidthHeight(width, height).fit(glCanvas.imageDimensions);
        maxDimension = Math.min(maxDimension, Math.max(maxRect.w, maxRect.h));
      }
    }

    // Call the parent constructor. Read the real dimensions as we may have to downscale.
    super(fim, width, height, maxDimension);
    let realDimensions = this.realDimensions;

    // Reduce requested color depth depending on GPU capabilities and desired quality
    let depth = glCanvas.getTextureDepth(options.bpp, (options.textureFlags & FimGLTextureFlags.LinearSampling) !== 0);
    options.bpp = depth.bpp;

    // Report telemetry for debugging
    recordCreate(this, FimObjectType.GLTexture, originalOptions, options, options.channels, options.bpp);

    let gl = this.gl = glCanvas.gl;
    this.glCanvas = glCanvas;
    this.textureOptions = options;
    this.hasImage = false;

    // Create a texture
    let texture = gl.createTexture();
    FimGLError.throwOnError(gl);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    FimGLError.throwOnError(gl);

    try {    
      // Set the parameters so we can render any size image
      if ((options.textureFlags & FimGLTextureFlags.Repeat) && !this.isSquarePot()) {
        // WebGL only supports non CLAMP_TO_EDGE texture wrapping with square power-of-two textures
        throw new FimGLError(FimGLErrorCode.AppError, 'TextureWrapNonSquarePot');
      }
      let clamp = (options.textureFlags & FimGLTextureFlags.Repeat) ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, clamp);
      FimGLError.throwOnError(gl);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, clamp);
      FimGLError.throwOnError(gl);

      let filter = (options.textureFlags & FimGLTextureFlags.LinearSampling) ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      FimGLError.throwOnError(gl);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      FimGLError.throwOnError(gl);

      // If width and height are specified, create a framebuffer to back this texture
      if ((options.textureFlags & FimGLTextureFlags.InputOnly) === 0) {
        // Allocate the texture
        let format = this.getGLFormat();
        gl.texImage2D(gl.TEXTURE_2D, 0, format, realDimensions.w, realDimensions.h, 0, format, depth.glConstant, null);
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

  public copyFrom(srcImage: IFimCanvas | IFimGLCanvas | IFimGreyscaleBuffer | IFimRgbaBuffer, srcCoords?: FimRect,
      destCoords?: FimRect): void {
    // Coordinates are purely for consistency with other classes' copyFrom() functions. Throw an error if they're
    // actually used.
    if (srcCoords || destCoords) {
      throw new FimGLError(FimGLErrorCode.AppError, 'Coords not supported');
    }

    // WebGL's texImage2D() will normally rescale an input image to the texture dimensions. However, if the input image
    // is greater than the maximum texture size, it returns an InvalidValue error. To avoid this, we'll explicitly
    // downscale larger images for WebGL.
    let maxDimension = FimGLCapabilities.getCapabilities(this.fim).maxTextureSize;
    if (srcImage.realDimensions.w > maxDimension || srcImage.realDimensions.h > maxDimension) {
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
  
  private copyFromCanvas(srcImage: IFimCanvas | IFimGLCanvas): void {
    let gl = this.gl;

    // Report telemetry for debugging
    recordTexImage2D(srcImage, this);

    this.bind(0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    FimGLError.throwOnError(gl);
    let format = this.getGLFormat();
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, srcImage.getCanvas());
    FimGLError.throwOnError(gl);
    this.unbind(0);

    this.hasImage = true;
  }

  private copyFromGreyscaleBuffer(srcImage: IFimGreyscaleBuffer): void {
    let gl = this.gl;

    // Report telemetry for debugging
    recordTexImage2D(srcImage, this);

    this.bind(0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    FimGLError.throwOnError(gl);
    let format = this.getGLFormat();
    gl.texImage2D(gl.TEXTURE_2D, 0, format, srcImage.w, srcImage.h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE,
      new Uint8Array(srcImage.getBuffer()));
    FimGLError.throwOnError(gl);
    this.unbind(0);

    this.hasImage = true;
  }

  private copyFromRgbaBuffer(srcImage: IFimRgbaBuffer): void {
    let gl = this.gl;

    // Report telemetry for debugging
    recordTexImage2D(srcImage, this);

    this.bind(0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    FimGLError.throwOnError(gl);
    let format = this.getGLFormat();
    gl.texImage2D(gl.TEXTURE_2D, 0, format, srcImage.w, srcImage.h, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array(srcImage.getBuffer()));
    FimGLError.throwOnError(gl);
    this.unbind(0);

    this.hasImage = true;
  }

  private copyFromWithDownscale(srcImage: IFimCanvas | IFimGLCanvas | IFimGreyscaleBuffer | IFimRgbaBuffer): void {
    if (srcImage instanceof FimGreyscaleBuffer) {
      // This code path needs to be optimized, but it will likely rarely, if ever, get used. FimGreyscaleBuffer
      // doesn't support resizing, nor does FimCanvas support copyFrom() a FimGreyscaleBuffer. So, we do multiple
      // steps:
      //  1. FimGreyscaleBuffer => FimRgbaBuffer
      //  2. FimRgbaBuffer => Downscale => FimCanvas (using the slower, non-async version)
      //  3. FimCanvas => FimTexture
      using(this.fim.createRgbaBuffer(srcImage.realDimensions.w, srcImage.realDimensions.h), temp => {
        temp.copyFrom(srcImage);
        this.copyFrom(temp);
      });
    } else if (srcImage instanceof FimCanvas || srcImage instanceof FimGLCanvas || srcImage instanceof FimRgbaBuffer) {
      // For all other object types, downscale to a FimCanvas of the target texture dimensions
      using(new FimCanvas(this.fim, this.realDimensions.w, this.realDimensions.h), temp => {
        temp.copyFrom(srcImage);
        this.copyFrom(temp);
      });
    } else {
      this.throwOnInvalidImageKind(srcImage);
    }
  }

  public copyTo(destImage: IFimGLCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    destImage.copyFrom(this, srcCoords, destCoords);
  }

  public dispose(): void {
    let gl = this.gl;

    // Report telemetry for debugging
    recordDispose(this, FimObjectType.GLTexture);

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
    if (this.textureOptions.textureFlags & FimGLTextureFlags.InputOnly) {
      // Cannot write to an input only texture
      throw new FimGLError(FimGLErrorCode.AppError, 'InputOnly');
    }
    return this.fb;
  }

  public isSquarePot(): boolean {
    return ((this.w & (this.w - 1)) === 0) && ((this.h & (this.h - 1)) === 0);
  }

  public readonly textureOptions: FimGLTextureOptions;

  /** Returns the WebGL constant for the texture's format */
  private getGLFormat(): number {
    let gl = this.gl;
    switch (this.textureOptions.channels) {
      case FimColorChannels.Greyscale:  return gl.LUMINANCE;
      case FimColorChannels.RGB:        return gl.RGB;
      case FimColorChannels.RGBA:       return gl.RGBA;
    }
  }

  /**
   * Boolean indicating whether this texture has an image. Set to true by any of the copyFrom() calls, or by using this
   * texture as the output of a FimGLProgram.
   */
  public hasImage: boolean;

  /** The FimGLCanvas object which was used to create this texture */
  public readonly glCanvas: IFimGLCanvas;

  private gl: WebGLRenderingContext;
  private texture: WebGLTexture;
  private fb: WebGLFramebuffer;

  /**
   * Creates a new WebGL texture from another image
   * @param canvas WebGL context
   * @param srcImage Source image
   * @param extraFlags Additional flags. InputOnly is always enabled for textures created via this function.
   */
  public static createFrom(canvas: FimGLCanvas, srcImage: IFimGreyscaleBuffer | IFimRgbaBuffer | IFimCanvas |
      IFimGLCanvas, extraFlags = FimGLTextureFlags.None): FimGLTexture {
    // Calculate parameters with defaults and extras
    let channels = (srcImage instanceof FimGreyscaleBuffer) ? FimColorChannels.Greyscale : FimColorChannels.RGBA;
    let bpp = FimBitsPerPixel.BPP8;
    let flags = FimGLTextureFlags.InputOnly | extraFlags;

    let texture = new FimGLTexture(canvas, srcImage.w, srcImage.h, { channels, bpp, textureFlags: flags });
    texture.copyFrom(srcImage);
    return texture;
  }

  /** Default options for FimGLTexture */
  private static readonly defaultOptions: FimGLTextureOptions = {
    channels: FimColorChannels.RGBA,
    bpp: FimBitsPerPixel.BPP32,
    textureFlags: FimGLTextureFlags.None
  };

  /**
   * Populates any missing fields with defaults and returns a complete FimGLTextureOptions object
   * @param options See FimGLTextureOptions
   */
  private static applyDefaults(options?: FimGLTextureOptions): FimGLTextureOptions {
    let defaultOptions = this.defaultOptions;

    options = options || {};
    options.bpp = options.bpp || defaultOptions.bpp;
    options.channels = options.channels || defaultOptions.channels;
    options.textureFlags = options.textureFlags || defaultOptions.textureFlags;

    // InputOnly textures are currently limited to 8 BPP, as FIM doesn't have any input formats that support higher.
    if (options.textureFlags & FimGLTextureFlags.InputOnly) {
      options.bpp = FimBitsPerPixel.BPP32;
    }

    // Most GPUs do not support rendering to a greyscale texture. There doesn't seem to be a capability to detect it,
    // so just use an RGBA one instead if the texture is not flagged InputOnly.
    if ((options.textureFlags & FimGLTextureFlags.InputOnly) === 0) {
      options.channels = FimColorChannels.RGBA;
    }

    return options;
  }

  /**
   * Returns a string describing the texture options.
   * 
   * This function takes in the same parameters as the constructor and returns a string which can be used to compare
   * two textures to know if they share the same options (for the purpose of reusing textures). It must be updated to
   * stay in sync with the constructor whenever parameters are added or default values are changed on FimGLTexture.
   * 
   * @param canvas FimGLCanvas from which the texture will be created
   * @param width Texture width, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param height Texture height, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param options See FimGLTextureOptions
   */
  public static describeTexture(canvas: IFimGLCanvas, width?: number, height?: number, options?: FimGLTextureOptions):
      string {
    // Default values
    width = width || canvas.w;
    height = height || canvas.h;
    options = this.applyDefaults(options);

    return `${width}:${height}:${options.bpp}:${options.channels}:${options.textureFlags}`;
  }
}

/** Internal-only version of the FimGLTexture class */
export class _FimGLTexture extends FimGLTexture {
  public constructor(glCanvas: FimGLCanvas, width?: number, height?: number, options?: FimGLTextureOptions) {
    super(glCanvas, width, height, options);
  }
}
