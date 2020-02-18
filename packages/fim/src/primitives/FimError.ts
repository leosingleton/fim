// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Exception class thrown when an error occurs */
export class FimError extends Error {
  public constructor(code: FimErrorCode, message?: string) {
    if (!message) {
      message = code;
    }
    super(message);
    this.code = code;
  }

  /** Error code */
  public readonly code: FimErrorCode;
}

/** Error codes */
export const enum FimErrorCode {
  OutOfMemory = 'OutOfMemory',

  /** Indicates that the application has a bug and is calling the FIM library in an unsupported way */
  AppError = 'AppError',

  ContextLost = 'ContextLost',
}
