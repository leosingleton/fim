// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Exception class thrown when a WebGL error occurs */
export class FimGLError extends Error {
  constructor(code: FimGLErrorCode, message?: string) {
    if (!message) {
      message = code;
    }
    super(message);
    this.code = code;
  }

  /** Error code */
  readonly code: FimGLErrorCode;

  static throwOnError(gl: WebGLRenderingContext): void {
    let errCode = gl.getError();
    switch (errCode) {
      case gl.NO_ERROR:
        return;

      case gl.INVALID_ENUM:
        throw new FimGLError(FimGLErrorCode.InvalidEnum);

      case gl.INVALID_VALUE:
        throw new FimGLError(FimGLErrorCode.InvalidValue);

      case gl.INVALID_OPERATION:
        throw new FimGLError(FimGLErrorCode.InvalidOperation);

      case gl.INVALID_FRAMEBUFFER_OPERATION:
        throw new FimGLError(FimGLErrorCode.InvalidFrameBufferOperation);

      case gl.OUT_OF_MEMORY:
        throw new FimGLError(FimGLErrorCode.OutOfMemory);

      case gl.CONTEXT_LOST_WEBGL:
        throw new FimGLError(FimGLErrorCode.ContextLost);

      default:
        throw new FimGLError(FimGLErrorCode.UnknownError, `Code ${errCode}`);
    }
  }

  /** Validates the result of gl.checkFramebufferStatus() and throws on a non-complete value */
  static throwOnFrameBufferStatus(gl: WebGLRenderingContext, target: number): void {
    let status = gl.checkFramebufferStatus(target);
    let code = FimGLErrorCode.FrameBufferStatus;
    switch (status) {
      case gl.FRAMEBUFFER_COMPLETE:
        return;

      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        throw new FimGLError(code, 'IncompleteAttachment');

      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        throw new FimGLError(code, 'IncompleteMissingAttachment');

      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        throw new FimGLError(code, 'IncompleteDimensions');

      case gl.FRAMEBUFFER_UNSUPPORTED:
        throw new FimGLError(code, 'Unsupported');

      default:
        throw new FimGLError(code, `Status ${status}`);
    }
  }
}

/**
 * Error codes. These values map to the gl.xxx integers returned by WebGLRenderingContext.getError(). In addition, new
 * error codes were added for specific errors that can occur in the FimGL code.
 */
export const enum FimGLErrorCode {
  UnknownError = 'UnknownError',
  InvalidEnum = 'InvalidEnum',
  InvalidValue = 'InvalidValue',
  InvalidOperation = 'InvalidOperation',
  InvalidFrameBufferOperation = 'InvalidFrameBufferOperation',
  OutOfMemory = 'OutOfMemory',
  ContextLost = 'ContextLost',
  CompileError = 'CompileError',
  LinkError = 'LinkError',

  /** Special error code thrown when the browser does not support WebGL */
  NoWebGL = 'NoWebGL',

  /**
   * Special error code for non-WebGL errors. Indicates that the application has a bug and is calling the FIM library
   * in an unsupported way.
   */
  AppError = 'AppError',

  /** Thrown when the framebuffer status is not complete */
  FrameBufferStatus = 'FrameBufferStatus'
}
