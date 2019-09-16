// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCapabilities } from './FimGLCapabilities';
import { FimGLError, FimGLErrorCode } from './FimGLError';
import { FimGLPreservedTexture } from './processor/FimGLPreservedTexture';
import { FimGLTexture, IFimGLTexture } from './FimGLTexture';
import { FimGLProgramCopy } from './programs/FimGLProgramCopy';
import { FimGLProgramFill } from './programs/FimGLProgramFill';
import { IFim } from '../Fim';
import { ContextLost } from '../debug/ContextLost';
import { FimConfig } from '../debug/FimConfig';
import { FimObjectType, recordCreate, recordDispose } from '../debug/FimStats';
import { FimCanvas, IFimCanvas } from '../image/FimCanvas';
import { FimCanvasBase, FimDefaultOffscreenCanvasFactory, IFimCanvasBase } from '../image/FimCanvasBase';
import { FimRgbaBuffer } from '../image/FimRgbaBuffer';
import { Transform2D } from '../math/Transform2D';
import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimColor } from '../primitives/FimColor';
import { FimRect } from '../primitives/FimRect';

export interface IFimGLCanvas extends IFimCanvasBase {
  /** Registers a lambda function to be executed on WebGL context lost */
  registerForContextLost(eventHandler: () => void): void;

  /** Registers a lambda function to be executed on WebGL context restored */
  registerForContextRestored(eventHandler: () => void): void;

  /** Returns whether the context is currently lost */
  isContextLost(): boolean;

  /** WebGL rendering context */
  readonly gl: WebGLRenderingContext;

  /**
   * A 0 to 1 value controlling the quality of rendering. Lower values can be used to improve performance.
   */
  renderQuality: number;

  /**
   * Determines the color depth for a FimGLTexture. Returns both the bits per pixel and correspoding WebGL constant.
   * The parameter is supplied as a maximum--the result may be lower than requested depending on WebGL capabilities and
   * performance.
   * @param maxBpp Maximum bits per pixel
   * @param linear True if linear filtering is required; false for nearest
   * @returns Object with two properties: {
   *    bpp: FimBitsPerPixel,
   *    glConstant: FLOAT, HALF_FLOAT_OES, or UNSIGNED_BYTE
   * }
   */
  getTextureDepth(maxBpp: FimBitsPerPixel, linear: boolean): { bpp: FimBitsPerPixel, glConstant: number };

  /**
   * Copies from a texture. Supports both cropping and rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  copyFrom(srcImage: IFimGLTexture | FimGLPreservedTexture, srcCoords?: FimRect, destCoords?: FimRect): void;

  /**
   * Copies image to another.
   * 
   * FimCanvas and HtmlCanvasElement support both cropping and rescaling, while FimRgbaBuffer only supports cropping.
   * 
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  copyTo(destImage: IFimCanvas | FimRgbaBuffer | HTMLCanvasElement, srcCoords?: FimRect, destCoords?: FimRect): void;
}

/** FimCanvas which leverages WebGL to do accelerated rendering */
export class FimGLCanvas extends FimCanvasBase implements IFimGLCanvas {
  /**
   * Creates an invisible canvas in the DOM that supports WebGL
   * @param fim FIM canvas factory
   * @param width Width, in pixels
   * @param height Height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   * @param offscreenCanvasFactory If provided, this function is used to instantiate an OffscreenCanvas object. If
   *    null or undefined, we create a canvas on the DOM instead. The default value checks the browser's capabilities,
   *    and uses Chrome's OffscreenCanvas functionality if supported.
   * @param quality A 0 to 1 value controlling the quality of rendering. Lower values can be used to improve
   *    performance.
   */
  constructor(fim: IFim, width: number, height: number, initialColor?: FimColor | string,
      offscreenCanvasFactory = FimCanvasBase.supportsOffscreenCanvas ? FimDefaultOffscreenCanvasFactory : null,
      quality = 1) {
    // Mobile and older GPUs may have limits as low as 2048x2048 for render buffers. Downscale the width and height if
    // necessary.
    let caps = FimGLCapabilities.getCapabilities(fim, offscreenCanvasFactory);
    let maxDimension = caps.maxRenderBufferSize;

    // The NVIDIA Quadro NVS 295 claims to have a maxRenderBufferSize of 8192 (the same as its maxTextureSize), but is
    // unstable if you create a WebGL canvas larger than 2048x2048. Ignore its capabilities and enforce a lower
    // maximum limit.
    if (caps.unmaskedVendor.indexOf('NVS 295') >= 0) {
      maxDimension = 2048;
    }

    // If a lower render buffer limit was set for debugging, use that instead
    let debugMaxDimension = FimConfig.config.maxGLRenderBufferSize;
    if (debugMaxDimension > 0) {
      maxDimension = Math.min(maxDimension, debugMaxDimension);
    }

    // Call the parent constructor
    super(fim, width, height, offscreenCanvasFactory, maxDimension);

    // Report telemetry for debugging
    recordCreate(this, FimObjectType.GLCanvas, null, 4, 8);

    this.renderQuality = quality;
    this.contextLostNotifications = [];
    this.contextRestoredNotifications = [];
    this.workaroundChromeBug = false;

    // Initialize WebGL
    let canvas = this.canvasElement;

    canvas.addEventListener('webglcontextlost', event => {
      console.log('Lost WebGL context');
      event.preventDefault();

      this.contextLostNotifications.forEach(eh => eh());

      if (this.copyProgram) {
        this.copyProgram.dispose();
        delete this.copyProgram;
      }
      if (this.fillProgram) {
        this.fillProgram.dispose();
        delete this.fillProgram;
      }
    }, false);

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');

      // I'm not 100% sure, but we probably will have re-enable all WebGL extensions after losing the WebGL context...
      this.loadExtensions();

      this.contextRestoredNotifications.forEach(eh => eh());
    }, false);

    let gl = this.gl = (canvas as HTMLCanvasElement).getContext('webgl');
    if (!gl) {
      throw new FimGLError(FimGLErrorCode.NoWebGL);
    }

    this.loadExtensions();

    // Disable unneeded features, as we are doing 2D graphics
    gl.disable(gl.BLEND);
    FimGLError.throwOnError(gl);
    gl.disable(gl.CULL_FACE);
    FimGLError.throwOnError(gl);
    gl.disable(gl.DEPTH_TEST);
    FimGLError.throwOnError(gl);

    if (initialColor) {
      this.fillCanvas(initialColor);
    }

    // Simulate intermittent context loss if the debugging option is enabled
    let contextLostInterval = FimConfig.config.contextLostSimulationInterval;
    if (contextLostInterval > 0) {
      ContextLost.simulateContextLoss(this, contextLostInterval);
    }
  }

  public dispose(): void {
    // Report telemetry for debugging
    recordDispose(this, FimObjectType.GLCanvas);

    super.dispose();
  }

  public registerForContextLost(eventHandler: () => void): void {
    this.contextLostNotifications.push(eventHandler);
  }

  public registerForContextRestored(eventHandler: () => void): void {
    this.contextRestoredNotifications.push(eventHandler);
  }

  public isContextLost(): boolean {
    return this.gl.isContextLost();
  }

  public readonly gl: WebGLRenderingContext;
  public renderQuality: number;

  public getTextureDepth(maxBpp: FimBitsPerPixel, linear: boolean): { bpp: FimBitsPerPixel, glConstant: number } {
    // If a lower BPP limit was set for debugging, use that instead
    let debugMaxBpp = FimConfig.config.maxGLBpp;
    if (debugMaxBpp > 0) {
      maxBpp = Math.min(maxBpp, debugMaxBpp);
    }

    // The quality values are arbitrarily chosen. 85% and above uses 32-bit precision; 50% and above uses 16-bit, and
    // below 50% falls back to 8-bit.
    if (maxBpp >= FimBitsPerPixel.BPP32 && this.renderQuality >= 0.85) {
      if (this.extensionTexture32 && this.extensionColorBuffer32) {
        if (!linear || this.extensionTextureLinear32) {
          return { bpp: FimBitsPerPixel.BPP32, glConstant: this.gl.FLOAT };
        }
      }
    }

    if (maxBpp >= FimBitsPerPixel.BPP16 && this.renderQuality >= 0.5) {
      let ext = this.extensionTexture16;
      if (ext && this.extensionColorBuffer16) {
        if (!linear || this.extensionTextureLinear16) {
          return { bpp: FimBitsPerPixel.BPP16, glConstant: ext.HALF_FLOAT_OES };
        }
      }
    }

    return { bpp: FimBitsPerPixel.BPP8, glConstant: this.gl.UNSIGNED_BYTE };
  }

  private loadExtensions(): void {
    let gl = this.gl;
    this.extensionTexture32 = gl.getExtension('OES_texture_float');
    this.extensionTextureLinear32 = gl.getExtension('OES_texture_float_linear');
    this.extensionColorBuffer32 = gl.getExtension('WEBGL_color_buffer_float');
    this.extensionTexture16 = gl.getExtension('OES_texture_half_float');
    this.extensionTextureLinear16 = gl.getExtension('OES_texture_half_float_linear');
    this.extensionColorBuffer16 = gl.getExtension('EXT_color_buffer_half_float');
  }

  private extensionTexture32: OES_texture_float;
  private extensionTextureLinear32: OES_texture_float_linear;
  private extensionColorBuffer32: WEBGL_color_buffer_float;
  private extensionTexture16: OES_texture_half_float;
  private extensionTextureLinear16: OES_texture_half_float_linear;
  private extensionColorBuffer16: any;

  private contextLostNotifications: (() => void)[];
  private contextRestoredNotifications: (() => void)[];

  /** Creates a new FimCanvas which is a duplicate of this one */
  public duplicateCanvas(): FimCanvas {
    let dupe = new FimCanvas(this.fim, this.w, this.h, null, this.offscreenCanvasFactory);
    dupe.copyFrom(this, this.imageDimensions, this.imageDimensions);
    return dupe;
  }

  /** Fills the canvas with a solid color */
  public fillCanvas(color: FimColor | string): void {
    let c = (color instanceof FimColor) ? color : FimColor.fromString(color);
    let gl = this.gl;

    // Chrome has a bug where subsequent calls to clear() do not work with OffscreenCanvas. Workaround by using a WebGL
    // shader instead. See: https://bugs.chromium.org/p/chromium/issues/detail?id=989874
    if (this.offscreenCanvas) {
      if (this.workaroundChromeBug) {
        let program = this.getFillProgram();
        program.setInputs(c);
        program.execute();
        return;
      } else {
        // Use workaround on the next call to fill()
        this.workaroundChromeBug = true;
      }
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    FimGLError.throwOnError(gl);
    gl.disable(gl.SCISSOR_TEST);
    FimGLError.throwOnError(gl);
    gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
    FimGLError.throwOnError(gl);
    gl.clear(gl.COLOR_BUFFER_BIT);
    FimGLError.throwOnError(gl);
  }

  private workaroundChromeBug: boolean;

  /** Returns a WebGL program to copy a texture to another, or to the canvas */
  protected getCopyProgram(): FimGLProgramCopy {
    return this.copyProgram = this.copyProgram || new FimGLProgramCopy(this);
  }

  private copyProgram: FimGLProgramCopy;

  /** Returns a WebGL program to fill a texture or canvas with a solid color */
  protected getFillProgram(): FimGLProgramFill {
    return this.fillProgram = this.fillProgram || new FimGLProgramFill(this);
  }

  private fillProgram: FimGLProgramFill;

  public copyFrom(srcImage: FimGLTexture | FimGLPreservedTexture, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Handle FimGLPreservedTexture by getting the underlying texture
    if (srcImage instanceof FimGLPreservedTexture) {
      srcImage = srcImage.getTexture();
    }

    // Validate source texture
    FimGLError.throwOnMismatchedGLCanvas(this, srcImage.glCanvas);

    // Default parameters
    srcCoords = srcCoords || srcImage.imageDimensions;
    destCoords = destCoords || this.imageDimensions;

    // Scale the source coordinates. FimGLProgram.execute() will scale the destination coordinates.
    srcCoords = srcCoords.rescale(srcImage.downscaleRatio);

    // Calculate the transformation matrix to achieve the requested srcCoords
    let matrix = Transform2D.fromSrcCoords(srcCoords, srcImage.imageDimensions);

    // Execute the copy shader
    let program = this.getCopyProgram();
    program.applyVertexMatrix(matrix);
    program.setInputs(srcImage);
    program.execute(null, destCoords);
  }

  public copyTo(destImage: FimCanvas | FimRgbaBuffer | HTMLCanvasElement, srcCoords?: FimRect,
      destCoords?: FimRect): void {
    if (destImage instanceof HTMLCanvasElement) {
      this.toHtmlCanvas(destImage, srcCoords, destCoords);
    } else {    
      destImage.copyFrom(this, srcCoords, destCoords);
    }
  }

  public getPixel(x: number, y: number): FimColor {
    let gl = this.gl;
    let pixel = new Uint8Array(4);

    // Scale the coordinates and flip Y, as the coordinates for readPixels start in the lower-left corner
    x = Math.round(x * this.downscaleRatio);
    y = Math.round((this.h - y - 1) * this.downscaleRatio);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    FimGLError.throwOnError(gl);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    FimGLError.throwOnError(gl);

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }
}
