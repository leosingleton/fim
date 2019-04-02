// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLError, FimGLErrorCode } from './FimGLError';
import { IFimGLContextNotify } from './IFimGLContextNotify';
import { FimCanvas, FimImageType } from '../image';
import { IDisposable } from '@leosingleton/commonlibs';

/** FimCanvas which leverages WebGL to do accelerated rendering */
export class FimGLCanvas extends FimCanvas {
  /**
   * Creates an invisible canvas in the DOM that supports WebGL
   * @param width Width, in pixels
   * @param height Height, in pixels
   * @param quality A 0 to 1 value controlling the quality of rendering. Lower values can be used to improve
   *    performance.
   */
  constructor(width: number, height: number, quality = 1) {
    super(width, height);
    this.renderQuality = quality;

    // Initialize WebGL
    let canvas = this.canvasElement;
    this.gl = canvas.getContext('webgl');
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    // Read the browser capabilities
    this.capabilities = this.readCapabilities();

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
  }

  public getType(): FimImageType {
    return FimImageType.FimGLCanvas;
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

  /**
   * Returns the WebGL capabilities of the current browser
   */
  public readonly capabilities: FimGLCapabilities;

  private readCapabilities(): FimGLCapabilities {
    let gl = this.gl;
    let caps = {
      glVersion: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      unmaskedVendor: '',
      unmaskedRenderer: '',
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      extensions: gl.getSupportedExtensions()
    };

    let dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbgRenderInfo) {
      caps.unmaskedVendor = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
      caps.unmaskedRenderer = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
    }

    return caps;
  }

  private objects: IFimGLContextNotify[] = [];
  private extensionTextureFloat: OES_texture_float;
  private extensionTextureHalfFloat: OES_texture_half_float;

  public createDrawingContext(imageSmoothingEnabled?: boolean, operation?: string, alpha?: number):
      CanvasRenderingContext2D & IDisposable {
    // Getting the 2D drawing context doesn't work (at least under Chrome) after using WebGL on a canvas. Prevent us
    // from returning null. The workaround is for the caller to copy the FimGLCanvas to a FimCanvas first, then get a
    // drawing context to the non-WebGL FimCanvas.
    throw new FimGLError(FimGLErrorCode.InvalidOperation);
  }
}

export interface FimGLCapabilities {
  glVersion: string,
  shadingLanguageVersion: string,
  vendor: string,
  renderer: string,
  unmaskedVendor: string,
  unmaskedRenderer: string,
  maxRenderBufferSize: number,
  maxTextureImageUnits: number,
  maxTextureSize: number,
  extensions: string[]
}
