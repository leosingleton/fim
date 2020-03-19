// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from './FimDimensions';

/** Exception class thrown when an error occurs */
export class FimError extends Error {
  public constructor(code: FimErrorCode, message?: string, errors?: Error[]) {
    const codeString = `FIM${code}`;
    message = message ?? codeString;
    super(message);
    this.name = codeString;
    this.code = code;
    this.collection = errors;
  }

  /** Error code */
  public readonly code: FimErrorCode;

  /**
   * Due to the pipelined design of FIM and WebGL, errors generally get batched up. If the exception occurs for more
   * than one reason, the lowest-valued error is reported and the individual error details are stored here.
   */
  public readonly collection: Error[];

  /**
   * Consolidates one or more errors into a single throwable error
   * @param errors Collection of errors
   * @returns FimError with the lowest-valued error code (the most severe) along with all error details
   */
  public static fromCollection(errors?: FimError[]): FimError {
    if (!errors || errors.length === 0) {
      return undefined;
    }

    if (errors.length === 1) {
      return errors[0];
    }

    // Combine the error messages and find the lowest-valued error code
    let message = 'Error Collection';
    let lowest = errors[0].code;
    for (const err of errors) {
      message += `\n  ${err.name}: ${err.message}`;
      if (err.code < lowest) {
        lowest = err.code;
      }
    }

    return new FimError(lowest, message, errors);
  }

  /**
   * Consolidates one or more errors into a single throwable error and throws it
   * @param errors Collection of errors
   * @returns Nothing if the collection is empty, otherwise this function never returns as it throws a FimError
   */
  public static throwCollection(errors?: FimError[]): void {
    const err = FimError.fromCollection(errors);
    if (err) {
      throw err;
    }
  }

  /**
   * Converts a non-FimError exception into a FimError
   * @param error Non-FimError exception
   * @returns FimError-wrapped exception
   */
  public static fromError(error: any): FimError {
    if (error instanceof FimError) {
      // Don't re-wrap FimErrors
      return error;
    }

    let message: string;
    if (error instanceof Error) {
      message = `${error.name}: ${error.message}`;
    } else {
      message = error.toString() ?? 'Unknown Error';
    }

    // Wrap non-FimErrors in a FimError
    return new FimError(FimErrorCode.NonFimError, message, [error]);
  }

  /**
   * Throws an UnreachableCode error
   */
  public static throwOnUnreachableCode(): never {
    throw new FimError(FimErrorCode.UnreachableCode);
  }

  /**
   * Throws an UnreachableCode error
   * @param value Value which was unexpected
   */
  public static throwOnUnreachableCodeValue(value: never): never {
    throw new FimError(FimErrorCode.UnreachableCode, value);
  }

  /**
   * Throws an InvalidParameter error
   * @param value Value of the invalid parameter
   */
  public static throwOnInvalidParameter(value: any): never {
    throw new FimError(FimErrorCode.InvalidParameter, `${value} invalid`);
  }

  /**
   * Throws an InvalidDimensions error
   * @param expectedDimensions Expected dimensions
   * @param actualDimensions Actual dimensions
   */
  public static throwOnInvalidDimensions(expectedDimensions: FimDimensions, actualDimensions: FimDimensions | number):
      never {
    throw new FimError(FimErrorCode.InvalidDimensions, `Expected ${expectedDimensions} but got ${actualDimensions}`);
  }

  /**
   * Throws an ObjectDisposed error
   * @param handle Handle of the object that is disposed
   */
  public static throwOnObjectDisposed(handle: string): never {
    throw new FimError(FimErrorCode.ObjectDisposed, `${handle} disposed`);
  }

  /**
   * Throws an ImageUnitialized error
   * @param handle Handle of the image that is uninitialized
   */
  public static throwOnImageUninitialized(handle: string): never {
    throw new FimError(FimErrorCode.ImageUninitialized, `${handle} uninitialized`);
  }

  /**
   * Throws an ImageReadonly error
   * @param handle Handle of the image that is readonly
   */
  public static throwOnImageReadonly(handle: string): never {
    throw new FimError(FimErrorCode.ImageReadonly, `${handle} readonly`);
  }
}

/** Error codes */
export const enum FimErrorCode {
  //
  // 1000-series errors are used when the FIM library is not supported
  //

  /** FIM1000: The web browser or Node.js environment does not support WebGL */
  NoWebGL = 1000,


  //
  // 2000-series errors are used for internal bugs in the FIM library itself
  //

  /** FIM2000: Catch-all for internal errors in the FIM library */
  GenericInternalError = 2000,

  /** FIM2001: Wrapper for any non-FimError exceptions caught within the library */
  NonFimError = 2001,

  /** FIM2002: Not implemented */
  NotImplemented = 2002,

  /** FIM2003: Code path expected to be unreachable was hit */
  UnreachableCode = 2003,


  //
  // 3000-series errors are wrappers around WebGL errors
  //

  /** FIM3000: Unknown WebGL error */
  WebGLUnknownError = 3000,

  WebGLInvalidEnum = 3101,
  WebGLInvalidValue = 3102,
  WebGLInvalidOperation = 3103,
  WebGLInvalidFrameBufferOperation = 3104,
  WebGLCompileError = 3105,
  WebGLLinkError = 3106,

  WebGLFramebufferStatusUnknown = 3200,
  WebGLFramebufferStatusIncompleteAttachment = 3201,
  WebGLFramebufferStatusIncompleteMissingAttachment = 3202,
  WebGLFramebufferStatusIncompleteDimensions = 3203,
  WebGLFramebufferStatusUnsupported = 3204,


  //
  // 4000-series errors are used for bugs in the the client application which it calls the FIM library in an
  // unsupported way
  //

  /** FIM4000: Catch-all for bugs in the client application */
  GenericAppError = 4000,

  /** FIM4100: Invalid parameter (supplied by the client application) */
  InvalidParameter = 4100,

  /** FIM4101: Invalid handle */
  InvalidHandle = 4101,

  /** FIM4102: Invalid dimensions */
  InvalidDimensions = 4102,

  /** FIM4103: Invalid operation on an object based on its current state */
  InvalidState = 4103,

  /** FIM4200: Attempted to call a method on a disposed object */
  ObjectDisposed = 4200,

  /** FIM4300: Attempted to read from an image or use it as an input before its contents were initialized */
  ImageUninitialized = 4300,

  /** FIM4301: Attempted to write from an image marked readonly */
  ImageReadonly = 4301,


  //
  // 5000-series errors are used for resource exhaustion
  //

  /** FIM5000: Out of memory */
  OutOfMemory = 5000,

  /** FIM5100: Out of memory (returned by a WebGL operation) */
  WebGLOutOfMemory = 5100,

  /** FIM5101: WebGL context was lost */
  WebGLContextLost = 5101
}
