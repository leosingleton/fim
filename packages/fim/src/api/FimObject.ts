// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
import { FimReleaseResourcesFlags } from './FimReleaseResourcesFlags';

/** Templated version of the `FimObject` interface which supports specific implementations of root and child classes */
export interface FimObject {
  /** Unique string describing the type of the object */
  readonly objectType: string;

  /** Handle including the full path from parent to child objects */
  readonly objectHandle: string;

  /** Array of references to child objects */
  readonly childObjects: FimObject[];

  /** Parent object. `undefined` for the root object. */
  readonly parentObject?: FimObject;

  /** Root object. Points to `this` for the root object. */
  readonly rootObject: Fim;

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
