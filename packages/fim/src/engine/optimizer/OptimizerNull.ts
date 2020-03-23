// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { OptimizerBase } from './OptimizerBase';

/**
 * Optimizer implementation which does no optimizations. It could be considered a "speed-optimized" implementation, in
 * that it never frees any memory, so is the fastest when there are no memory constraints.
 */
export class OptimizerNull extends OptimizerBase {
  public releaseResources(): void {
    // Do nothing. The null optimizer never releases resources.
  }
}
