// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { CoreShader } from './CoreShader';
import { CoreTexture } from './CoreTexture';
import { CoreWebGLObject } from './CoreWebGLObject';
import { RenderingContextWebGL } from './types/RenderingContextWebGL';
import { FimWebGLCapabilities } from '../api/FimCapabilities';
import { FimColor } from '../primitives/FimColor';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimDimensions } from '../primitives/FimDimensions';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvasWebGL extends CoreCanvas {
  /** Derived classes must override this method to call canvas.getContext('webgl') */
  protected abstract getContext(): RenderingContextWebGL;

  /** Shader and texture objects that belong to this WebGL canvas */
  public childObjects: CoreWebGLObject[] = [];

  public dispose(): void {
    // Dispose all child objects
    for (const child of this.childObjects) {
      child.dispose();
    }
    this.childObjects = [];

    super.dispose();
  }

  /** Checks for any WebGL errors and throws a FimError if there are any */
  protected throwWebGLErrors(): void {
    const gl = this.getContext();
    const errors: FimError[] = [];
    let done = false;
    do {
      const errorCode = gl.getError();
      if (errorCode === gl.NO_ERROR) {
        done = true;
      } else {
        const fimCode = CoreCanvasWebGL.convertWebGLErrorToFimCode(gl, errorCode);
        const fimMessage = `WebGL ${errorCode}`;
        errors.push(new FimError(fimCode, fimMessage));
      }
    } while (!done);

    FimError.throwCollection(errors);
  }

  /** If we are in debugging mode, checks for any WebGL errors and throws a FimError if there are any */
  protected throwWebGLErrorsDebug(): void {
    if (this.engineOptions.debugMode) {
      this.throwWebGLErrors();
    }
  }

  /**
   * Converts a WebGL error code to a FIM error code
   * @param gl WebGL context
   * @param errorCode WebGL error code
   * @returns FIM error code
   */
  private static convertWebGLErrorToFimCode(gl: RenderingContextWebGL, errorCode: number): FimErrorCode {
    switch (errorCode) {
      case gl.INVALID_ENUM:
        return FimErrorCode.WebGLInvalidEnum;

      case gl.INVALID_VALUE:
        return FimErrorCode.WebGLInvalidValue;

      case gl.INVALID_OPERATION:
        return FimErrorCode.WebGLInvalidOperation;

      case gl.INVALID_FRAMEBUFFER_OPERATION:
        return FimErrorCode.WebGLInvalidFrameBufferOperation;

      case gl.OUT_OF_MEMORY:
        return FimErrorCode.WebGLOutOfMemory;

      case gl.CONTEXT_LOST_WEBGL:
        return FimErrorCode.WebGLContextLost;

      default:
        return FimErrorCode.WebGLUnknownError;
    }
  }

  /** Validates the result of gl.checkFramebufferStatus() and throws on a non-complete value */
  protected throwOnIncompleteFrameBufferStatus(target: number): void {
    const gl = this.getContext();
    const status = gl.checkFramebufferStatus(target);
    switch (status) {
      case gl.FRAMEBUFFER_COMPLETE:
        return;

      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusIncompleteAttachment);

      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusIncompleteMissingAttachment);

      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusIncompleteDimensions);

      case gl.FRAMEBUFFER_UNSUPPORTED:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusUnsupported);

      default:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusUnknown, `FramebufferStatus ${status}`);
    }
  }

  /**
   * Detects the browser and GPU capabilities. It is best to create a small CoreCanvasWebGL instance solely for calling
   * this method in order to avoid exceeding the GPU's maximum render buffer dimensions.
   */
  public detectCapabilities(): FimWebGLCapabilities {
    this.ensureNotDisposed();

    const gl = this.getContext();
    const dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');

    return {
      glVersion: gl.getParameter(gl.VERSION),
      glShadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      glVendor: gl.getParameter(gl.VENDOR),
      glRenderer: gl.getParameter(gl.RENDERER),
      glUnmaskedVendor: dbgRenderInfo ? gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) : '',
      glUnmaskedRenderer: dbgRenderInfo ? gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL) : '',
      glMaxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      glMaxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      glMaxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      glExtensions: gl.getSupportedExtensions().sort()
    };
  }

  /**
   * Calls the CoreShader constructor
   */
  public createCoreShader(): CoreShader {
    return new CoreShader(this);
  }

  /**
   * Calls the CoreTexture constructor
   * @param dimensions Texture dimensions
   */
  public createCoreTexture(dimensions: FimDimensions): CoreTexture {
    return new CoreTexture(this, dimensions);
  }

  public fillCanvas(color: FimColor | string): void {
    const me = this;

    me.ensureNotDisposed();
    const gl = me.getContext();
    const c = (color instanceof FimColor) ? color : FimColor.fromString(color);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    me.throwWebGLErrorsDebug();
    gl.viewport(0, 0, this.canvasDimensions.w, this.canvasDimensions.h);
    me.throwWebGLErrorsDebug();
    gl.disable(gl.SCISSOR_TEST);
    me.throwWebGLErrorsDebug();
    gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
    me.throwWebGLErrorsDebug();
    gl.clear(gl.COLOR_BUFFER_BIT);
    me.throwWebGLErrorsDebug();
  }

  public getPixel(x: number, y: number): FimColor {
    const me = this;

    me.ensureNotDisposed();
    const gl = me.getContext();
    const pixel = new Uint8Array(4);

    // Flip Y, as the coordinates for readPixels start in the lower-left corner
    const point = FimPoint.fromXY(x, this.canvasDimensions.h - y - 1).toFloor();
    this.validateCoordinates(point);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    me.throwWebGLErrorsDebug();
    gl.readPixels(point.x, point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    me.throwWebGLErrors();

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }
}
