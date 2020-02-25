// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { RenderingContextWebGL } from './types/RenderingContextWebGL';
import { FimColor } from '../primitives/FimColor';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvasWebGL extends CoreCanvas {
  /** Derived classes must override this method to call canvas.getContext('webgl') */
  protected abstract getContext(): RenderingContextWebGL;

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

  public fillCanvas(color: FimColor | string): void {
    const me = this;
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
    const gl = me.getContext();
    const pixel = new Uint8Array(4);

    // Scale the coordinates and flip Y, as the coordinates for readPixels start in the lower-left corner
    const point = FimPoint.fromXY(x, this.canvasDimensions.h - y - 1).toFloor();
    this.validateCoordinates(point);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    me.throwWebGLErrorsDebug();
    gl.readPixels(point.x, point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    me.throwWebGLErrors();

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }
}
