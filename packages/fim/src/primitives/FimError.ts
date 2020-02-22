// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

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

  /** FIM2100: Invalid opcode */
  InvalidOpcode = 2100,


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

  /** FIM4200: Attempted to call a method on a disposed object */
  ObjectDisposed = 4200,


  //
  // 5000-series errors are used for resource exhaustion
  //

  /** FIM5000: Out of memory */
  OutOfMemory = 5000,

  /** FIM5100: WebGL context was lost */
  ContextLost = 5100
}
