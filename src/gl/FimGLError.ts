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
        throw new FimGLError(FimGLErrorCode.UnknownError, 'Code ' +  errCode);
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
  UnknownUniform = 'UnknownUniform'
}
