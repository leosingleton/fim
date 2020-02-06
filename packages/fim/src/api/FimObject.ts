// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Common properties for all objects in the FIM API */
export interface FimObject {
  /** Unique value identifying this object */
  readonly handle: string;

  /**
   * Releases memory and GPU resources.
   *
   * Unlike dispose(), releaseResources() may be called any number of times, and the object is still good for use after
   * releasing resources--it just must be reinitialized with new data.
   */
  releaseResources(): void;

  /**
   * Completely disposes all memory and GPU resources.
   *
   * Once disposed, the object may no longer be used whatsoever. Any calls to methods or even dispose() multiple times
   * on the same object will result in a FimError exception of type AppError.
   */
  dispose(): void;
}
