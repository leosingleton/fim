// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionStrategy } from './FimExecutionStrategy';

/** Options for the FIM execution engine */
export interface FimEngineOptions {
  /**
   * Disables offscreen canvas support. This can be useful for debugging, as Chrome's support is new and still has some
   * bugs, plus regular canvases can be made visible in the browser's debugging tools.
   */
  disableOffscreenCanvas: boolean;

  /** Execution strategy (space vs. time) */
  executionStrategy: FimExecutionStrategy;

  /** Maximum canvas memory to use, in bytes. 0 for no limit. */
  maxCanvasMemory: number;

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
export const defaultEngineOptions: FimEngineOptions = {
  disableOffscreenCanvas: false,
  executionStrategy: FimExecutionStrategy.MaximizeSpeed,
  maxCanvasMemory: 0,
  maxGLMemory: 0,
  debugMode: false,
  showTracing: false,
  showWarnings: true
};
