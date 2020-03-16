// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimReleaseResourcesFlags } from './FimReleaseResourcesFlags';

/** Common properties for all objects in the FIM API */
export interface FimObject {
  /** Handle including the full path from parent to child objects */
  readonly handle: string;

  /** Array of references to child objects */
  readonly childObjects: FimObject[];

  /** Parent object. Undefined for the root object. */
  readonly parentObject: FimObject;

  /**
   * Releases memory and/or GPU resources.
   *
   * Unlike dispose(), releaseResources() may be called any number of times, and the object is still good for use after
   * releasing resources--it just must be reinitialized with new data.
   *
   * @param flags Specifies which resources to release
   */
  releaseResources(flags: FimReleaseResourcesFlags): void;

  /** Equivalent to releaseResources(FimReleaseResourcesFlags.All) */
  releaseAllResources(): void;

  /**
   * Completely disposes all memory and GPU resources.
   *
   * Once disposed, the object may no longer be used whatsoever. Any calls to methods or even dispose() multiple times
   * on the same object will result in a FimError exception of type AppError.
   */
  dispose(): void;
}
