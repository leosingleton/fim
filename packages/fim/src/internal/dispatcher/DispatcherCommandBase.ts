// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherOptimizationHints } from './DispatcherOptimizationHints';

/** Base class for all FIM engine commands */
export interface DispatcherCommandBase {
  /** Unique string identifying the FIM engine command */
  command: string;

  /** Optimization hints for the FIM engine and command dispatchers */
  optimizationHints: DispatcherOptimizationHints;
}
