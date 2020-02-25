// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionStrategy } from './FimExecutionStrategy';

/** Options for the FIM execution engine */
export interface FimExecutionOptions {
  /** Execution strategy (space vs. time) */
  strategy: FimExecutionStrategy;

  /** Maximum GPU memory to use, in bytes. 0 for no limit. */
  maxGLMemory: number;

  /**
   * Checks for errors on every WebGL call. While useful for debugging, enabling this can have a negative impact on
   * WebGL's ability to pipeline GPU operations.
   */
  debugMode: boolean;

  /** Writes messages to the console tracing execution through the rendering pipeline */
  showTracing: boolean;

  /** Writes messages to the console whenever FIM detects potential application optimizations in its API usage */
  showWarnings: boolean;
}

/** Default values when FIM is first instantiated */
export const defaultExecutionOptions: FimExecutionOptions = {
  strategy: FimExecutionStrategy.MaximizeSpeed,
  maxGLMemory: 0,
  debugMode: false,
  showTracing: false,
  showWarnings: true
};
