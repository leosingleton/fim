// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCapabilities } from './FimGLCapabilities';
import { FimGLError, FimGLErrorCode } from './FimGLError';
import { IFimGLContextNotify } from './IFimGLContextNotify';
import { FimGLProgramFill } from './programs';
import { FimCanvas } from '../image/FimCanvas';
import { FimCanvasBase } from '../image/FimCanvasBase';
import { FimRgbaBuffer } from '../image/FimRgbaBuffer';
import { FimBitsPerPixel, FimColor, FimRect } from '../primitives';
import { using } from '@leosingleton/commonlibs';

/** FimCanvas which leverages WebGL to do accelerated rendering */
export class FimGLCanvas extends FimCanvasBase {
  /**
   * Creates an invisible canvas in the DOM that supports WebGL
   * @param width Width, in pixels
   * @param height Height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   * @param useOffscreenCanvas If this parameter is true, an offscreen canvas will be used. These can be used in web
   *    workers. Check FimCanvasBase.supportsOffscreenCanvas to determine whether the web browser supports the
   *    OffscreenCanvas feature.
   * @param quality A 0 to 1 value controlling the quality of rendering. Lower values can be used to improve
   *    performance.
   */
  constructor(width: number, height: number, initialColor?: FimColor | string,
      useOffscreenCanvas = FimGLCanvas.supportsOffscreenCanvas, quality = 1) {
    // Mobile and older GPUs may have limits as low as 2048x2048 for render buffers. Downscale the width and height if
    // necessary.
    let caps = FimGLCapabilities.getCapabilities();
    let maxDimension = caps.maxRenderBufferSize;

    // The NVIDIA Quadro NVS 295 claims to have a maxRenderBufferSize of 8192 (the same as its maxTextureSize), but is
    // unstable if you create a WebGL canvas larger than 2048x2048. Ignore its capabilities and enforce a lower
    // maximum limit.
    if (caps.unmaskedVendor.indexOf('NVS 295') >= 0) {
      maxDimension = 2048;
    }

    // Call the parent constructor
    super(width, height, useOffscreenCanvas, maxDimension);

    this.renderQuality = quality;
    this.objects = [];
    this.workaroundChromeBug = false;

    // Initialize WebGL
    let canvas = this.canvasElement;

    canvas.addEventListener('webglcontextlost', event => {
      console.log('Lost WebGL context');
      event.preventDefault();

      this.objects.forEach(o => o.onContextLost());

      if (this.fillProgram) {
        this.fillProgram.dispose();
        this.fillProgram = undefined;
      }
    }, false);

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');

      // I'm not 100% sure, but we probably will have re-enable all WebGL extensions after losing the WebGL context...
      this.loadExtensions();

      this.objects.forEach(o => o.onContextRestored());
    }, false);

    let gl = this.gl = canvas.getContext('webgl');
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
      this.fill(initialColor);
    }
  }

  public registerObject(object: IFimGLContextNotify): void {
    this.objects.push(object);
  }

  /** WebGL rendering context */
  public readonly gl: WebGLRenderingContext;

  /**
   * A 0 to 1 value controlling the quality of rendering. Lower values can be used to improve performance.
   */
  public renderQuality: number;

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
  public getTextureDepth(maxBpp: FimBitsPerPixel, linear: boolean): { bpp: FimBitsPerPixel, glConstant: number } {
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

  private objects: IFimGLContextNotify[];

  /** Creates a new FimCanvas which is a duplicate of this one */
  public duplicate(): FimCanvas {
    let dupe = new FimCanvas(this.dimensions.w, this.dimensions.h);
    dupe.copyFrom(this, this.dimensions, this.dimensions);
    return dupe;
  }

  /** Fills the canvas with a solid color */
  public fill(color: FimColor | string): void {
    let c = (color instanceof FimColor) ? color : FimColor.fromString(color);
    let gl = this.gl;

    // Chrome has a bug where subsequent calls to clear() do not work with OffscreenCanvas. Workaround by using a WebGL
    // shader instead. See: https://bugs.chromium.org/p/chromium/issues/detail?id=989874
    if (this.offscreenCanvas) {
      if (this.workaroundChromeBug) {
        let program = this.fillProgram = this.fillProgram || new FimGLProgramFill(this);
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
    gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
    FimGLError.throwOnError(gl);
    gl.clear(gl.COLOR_BUFFER_BIT);
    FimGLError.throwOnError(gl);
  }

  private fillProgram: FimGLProgramFill;
  private workaroundChromeBug: boolean;

  /**
   * Copies image to another.
   * 
   * FimCanvas supports both cropping and rescaling, while FimRgbaBuffer only supports cropping.
   * 
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyTo(destImage: FimCanvas | FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    destImage.copyFrom(this, srcCoords, destCoords);
  }

  public getPixel(x: number, y: number): FimColor {
    let pixel: Uint8ClampedArray;

    // Scale the coordinates
    x *= Math.round(this.downscaleRatio);
    y *= Math.round(this.downscaleRatio);
    
    using(new FimRgbaBuffer(1, 1), buffer => {
      buffer.copyFrom(this, FimRect.fromXYWidthHeight(x, y, 1, 1));
      pixel = buffer.getBuffer();
    });

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }
}
