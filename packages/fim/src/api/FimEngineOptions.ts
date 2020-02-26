// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionStrategy } from './FimExecutionStrategy';

/** Options for the FIM execution engine */
export interface FimEngineOptions {
  /** Execution strategy (space vs. time) */
  executionStrategy: FimExecutionStrategy;

  /** Maximum canvas memory to use, in bytes. 0 for no limit. */
  maxCanvasMemory: number;

  /** Maximum GPU memory to use, in bytes. 0 for no limit. */
  maxGLMemory: number;

  /**
   * Disables offscreen canvas support. This can be useful for debugging, as Chrome's support is new and still has some
   * bugs, plus regular canvases can be made visible in the browser's debugging tools.
   */
  disableOffscreenCanvas: boolean;

  /**
   * If set to a positive number, the WebGL render buffer is limited to the lower of this value or the GPU's stated
   * capabilities.
   */
  maxGLRenderBufferSize: number;

  /**
   * If set to a positive number, the WebGL texture size is limited to the lower of this value or the GPU's stated
   * capabilities.
   */
  maxGLTextureSize: number;

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
  executionStrategy: FimExecutionStrategy.MaximizeSpeed,
  maxCanvasMemory: 0,
  maxGLMemory: 0,
  disableOffscreenCanvas: false,
  maxGLRenderBufferSize: 0,
  maxGLTextureSize: 0,
  debugMode: false,
  showTracing: false,
  showWarnings: true
};