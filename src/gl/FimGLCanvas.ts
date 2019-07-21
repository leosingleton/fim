// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCapabilities } from './FimGLCapabilities';
import { FimGLError, FimGLErrorCode } from './FimGLError';
import { IFimGLContextNotify } from './IFimGLContextNotify';
import { FimCanvas } from '../image/FimCanvas';
import { FimCanvasBase } from '../image/FimCanvasBase';
import { FimRgbaBuffer } from '../image/FimRgbaBuffer';
import { FimColor, FimRect } from '../primitives';
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

    super(width, height, useOffscreenCanvas, maxDimension);
    this.renderQuality = quality;
    this.objects = [];

    // Initialize WebGL
    let canvas = this.canvasElement;

    canvas.addEventListener('webglcontextlost', event => {
      console.log('Lost WebGL context');
      event.preventDefault();

      // I'm not 100% sure, but we probably will have re-enable the OES_texture_float extension after losing the WebGL
      // context...
      this.extensionTextureFloat = undefined;
      this.extensionTextureHalfFloat = undefined;

      this.objects.forEach(o => o.onContextLost());
    }, false);

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      this.objects.forEach(o => o.onContextRestored());
    }, false);

    this.gl = canvas.getContext('webgl');
    if (!this.gl) {
      throw new FimGLError(FimGLErrorCode.NoWebGL);
    }

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
   * Determines the color depth to use for textures
   */
  public getMaxTextureDepthValue(): number {
    // The quality values are arbitrarily chosen. 85% and above uses 32-bit precision; 50% and above uses 16-bit, and
    // below 50% falls back to 8-bit.
    if (this.renderQuality >= 0.85) {
      if (this.getTextureFloatExtension()) {
        return this.gl.FLOAT;
      }
    }

    // Disabling half float support for now. It was crashing on Chrome on OS X.
    /*if (this.quality >= 0.5) {
      let ext = this.getTextureHalfFloatExtension();
      if (ext) {
        return ext.HALF_FLOAT_OES;
      }
    }*/

    return this.gl.UNSIGNED_BYTE;
  }

  /**
   * OES_texture_float is a WebGL extension that improves image quality by using 32 bits per channel instead of the
   * standard 8 bits per channel. However, it is not supported by all GPUs, and must first be enabled on _each_ WebGL
   * context within the web page.
   * 
   * This returns the extension if it is supported and automatically enables it if possible.
   */  
  private getTextureFloatExtension(): OES_texture_float {
    if (this.extensionTextureFloat === null) {
      return null;
    } else if (this.extensionTextureFloat) {
      return this.extensionTextureFloat;
    }

    let ext = this.gl.getExtension('OES_texture_float');
    if (ext) {
      console.log('Supports OES_texture_float');
    }
    this.extensionTextureFloat = ext;
    return ext;
  }

  /**
   * Checks support for the OES_texture_half_float WebGL extension. See comments on getTextureFloatExtension() for
   * details.
   */
  private getTextureHalfFloatExtension(): OES_texture_half_float {
    if (this.extensionTextureHalfFloat === null) {
      return null;
    } else if (this.extensionTextureHalfFloat) {
      return this.extensionTextureHalfFloat;
    }

    let ext = this.gl.getExtension('OES_texture_half_float');
    if (ext) {
      console.log('Supports OES_texture_half_float');
    }
    this.extensionTextureHalfFloat = ext;
    return ext;
  }

  private objects: IFimGLContextNotify[];
  private extensionTextureFloat: OES_texture_float;
  private extensionTextureHalfFloat: OES_texture_half_float;

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
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

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

    using(new FimRgbaBuffer(1, 1), buffer => {
      buffer.copyFrom(this, FimRect.fromXYWidthHeight(x, y, 1, 1));
      pixel = buffer.getBuffer();
    });

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }
}
