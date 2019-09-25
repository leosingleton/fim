// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLError, FimGLErrorCode } from './FimGLError';
import { Fim } from '../Fim';
import { FimCanvasBase } from '../image/FimCanvasBase';
import { FimCanvasType } from '../image/FimCanvasFactory';

/** Helper class to create a temporary WebGL canvas, just for reading capabilities */
class WebGLHelper extends FimCanvasBase {
  public constructor(fim: Fim) {
    // Use a small canvas that any browser supporting WebGL can handle
    super(fim, 240, 240, FimCanvasType.WebGL);
    let canvas = this.canvasElement;

    canvas.addEventListener('webglcontextcreationerror', this.onWebGLContextCreationError.bind(this), false);

    this.gl = (canvas as HTMLCanvasElement).getContext('webgl');
    if (!this.gl) {
      throw new FimGLError(FimGLErrorCode.NoWebGL, this.contextFailMessage);
    }
  }

  /** Returns additional error details in case getContext('webgl') fails */
  private contextFailMessage: string;

  private onWebGLContextCreationError(event: WebGLContextEvent): void {
    this.contextFailMessage = event.statusMessage;
  }

  public dispose(): void {
    let canvas = this.canvasElement;
    if (canvas) {
      canvas.removeEventListener('webglcontextcreationerror', this.onWebGLContextCreationError.bind(this), false);
    }

    super.dispose();
  }

  /** WebGL rendering context */
  public readonly gl: WebGLRenderingContext;

  public duplicateCanvas(): never {
    throw new FimGLError(FimGLErrorCode.AppError);
  }
  
  public fillCanvas(color: never): never {
    throw new FimGLError(FimGLErrorCode.AppError);
  }
}

/** WebGL capabilities of the current browser */
export interface IFimGLCapabilities {
  readonly glVersion: string;
  readonly shadingLanguageVersion: string;
  readonly vendor: string;
  readonly renderer: string;
  readonly unmaskedVendor: string;
  readonly unmaskedRenderer: string;
  readonly maxRenderBufferSize: number;
  readonly maxTextureImageUnits: number;
  readonly maxTextureSize: number;
  readonly extensions: string[];
}

/**
 * Returns the WebGL capabilities of the current browser
 * @param fim FIM canvas factory
 */
export function _getGLCapabilities(fim: Fim): IFimGLCapabilities {
  // For performance, only read capabilities on the first call and cache the results.
  if (caps) {
    return caps;
  }

  let helper = new WebGLHelper(fim);
  try {
    let gl = helper.gl;
    let dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');

    caps = {
      glVersion: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      unmaskedVendor: dbgRenderInfo ? gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) : '',
      unmaskedRenderer: dbgRenderInfo ? gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL) : '',
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      extensions: gl.getSupportedExtensions().sort()
    };
  } finally {
    helper.dispose();
  }

  return caps;
}

let caps: IFimGLCapabilities;
