// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionStrategy } from './FimExecutionStrategy';
import { FimDimensions } from '../primitives/FimDimensions';

/** Options for the FIM execution engine */
export interface FimEngineOptions {
  /** Execution strategy (space vs. time) */
  executionStrategy: FimExecutionStrategy;

  /**
   * Maximum dimensions of any image. Defaults to the maximum image size supported by the WebGL capabilities of the
   * browser and GPU.
   */
  maxImageDimensions: FimDimensions;

  /** Maximum canvas memory to use, in bytes. 0 for no limit. */
  maxCanvasMemory: number;

  /** Maximum GPU memory to use, in bytes. 0 for no limit. */
  maxGLMemory: number;

  /**
   * Number of instances of a single WebGL shader allowed at any time. Changing constant values causes the shader to get
   * recompiled, resulting in multiple instances. In some cases, this may be desired, however this has the potential to
   * create a resource leak. Set to 0 for no limit.
   */
  shaderInstanceLimit: number;

  /**
   * Disables offscreen canvas support. This can be useful for debugging, as Chrome's support is new and still has some
   * bugs, plus regular canvases can be made visible in the browser's debugging tools.
   */
  disableOffscreenCanvas: boolean;

  /**
   * Disables image bitmap support. This can be useful for debugging, as not all web browsers support ImageBitmap
   * objects yet.
   */
  disableImageBitmap: boolean;

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

/**
 * Default values when FIM is first instantiated. Note that EngineFim does browser and GPU capability detection, and
 * may immediately change them based on actual capabilities.
 */
export const defaultEngineOptions: FimEngineOptions = {
  executionStrategy: FimExecutionStrategy.MaximizeSpeed,
  maxImageDimensions: FimDimensions.fromSquareDimension(1),
  maxCanvasMemory: 0,
  maxGLMemory: 0,
  shaderInstanceLimit: 4,
  disableOffscreenCanvas: true,
  disableImageBitmap: true,
  maxGLRenderBufferSize: 0,
  maxGLTextureSize: 0,
  debugMode: false,
  showTracing: false,
  showWarnings: true
};
