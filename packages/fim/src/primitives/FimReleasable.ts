// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/**
 * Objects within FIM that have the ability to release memory or GPU resources. Unlike IDisposable.dispose(),
 * FimReleasable.releaseResources() may be called any number of times, and the object is still good for use after
 * releasing resources--it just must be reinitialized with new data.
 */
export interface FimReleasable {
  /** Releases memory and GPU resources */
  releaseResources(): void;
}
