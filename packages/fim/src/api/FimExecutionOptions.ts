// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionStrategy } from './FimExecutionStrategy';

/** Options for the FIM execution engine */
export interface FimExecutionOptions {
  /** Execution strategy (space vs. time) */
  strategy: FimExecutionStrategy;

  /** Maximum GPU memory to use, in bytes. 0 for no limit. */
  maxGlMemory: number;

  /**
   * WebGL calls can block for a significant amount of time, making the execution thread unresponsive. If set, this
   * function is awaited between WebGL calls to give the message loop and other code time to execute.
   *
   * For a sample implementation, see the TaskScheduler in the @leosingleton/commonlibs NPM package.
   */
  nice?: () => Promise<void>;

  /**
   * Checks for errors on every WebGL call. While useful for debugging, enabling this can have a negative impact on
   * WebGL's ability to pipeline GPU operations.
   */
  debugMode: boolean;

  /**
   * Writes messages to the console whenever FIM detects potential application optimizations in its API usage.
   */
  showWarnings: boolean;
}

export const defaultExecutionOptions: FimExecutionOptions = {
  strategy: FimExecutionStrategy.MaximizeSpeed,
  maxGlMemory: 0,
  debugMode: false,
  showWarnings: true
};
