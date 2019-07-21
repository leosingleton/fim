// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLError, FimGLErrorCode } from './FimGLError';
import { FimCanvasBase } from '../image/FimCanvasBase';

/** Helper class to create a temporary WebGL canvas, just for reading capabilities */
class WebGLHelper extends FimCanvasBase {
  public constructor() {
    // Use a small canvas that any browser supporting WebGL can handle
    super(240, 240);

    this.gl = this.canvasElement.getContext('webgl');
    if (!this.gl) {
      throw new FimGLError(FimGLErrorCode.NoWebGL);
    }
  }

  /** WebGL rendering context */
  public readonly gl: WebGLRenderingContext;

  public duplicate(): never {
    throw new FimGLError(FimGLErrorCode.AppError);
  }
  
  public fill(color: never): never {
    throw new FimGLError(FimGLErrorCode.AppError);
  }
}

/** WebGL capabilities of the current browser */
export class FimGLCapabilities {
  public readonly glVersion: string;
  public readonly shadingLanguageVersion: string;
  public readonly vendor: string;
  public readonly renderer: string;
  public readonly unmaskedVendor: string;
  public readonly unmaskedRenderer: string;
  public readonly maxRenderBufferSize: number;
  public readonly maxTextureImageUnits: number;
  public readonly maxTextureSize: number;
  public readonly extensions: string[];

  private constructor() {
    let helper = new WebGLHelper();
    try {
      let gl = helper.gl;

      this.glVersion = gl.getParameter(gl.VERSION);
      this.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
      this.vendor = gl.getParameter(gl.VENDOR);
      this.renderer = gl.getParameter(gl.RENDERER);
      this.unmaskedVendor = '';
      this.unmaskedRenderer = '';
      this.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      this.maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      this.extensions = gl.getSupportedExtensions();

      let dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbgRenderInfo) {
        this.unmaskedVendor = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
        this.unmaskedRenderer = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
      }
    } finally {
      helper.dispose();
    }
  }

  private static caps: FimGLCapabilities;

  /** Returns the WebGL capabilities of the current browser */
  public static getCapabilities(): FimGLCapabilities {
    // For performance, only read capabilities on the first call and cache the results.
    if (!this.caps) {
      this.caps = new FimGLCapabilities();
    }

    return this.caps;
  }
}
