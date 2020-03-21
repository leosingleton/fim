// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Object to return the current state of resource usage in an instance of the FIM library */
export interface FimResourceUsage {
  /** 2D canvas resources, including `OffscreenCanvas` objects */
  canvas2D: FimResourceMetrics;

  /** WebGL canvas resources, including `OffscreenCanvas` objects */
  canvasWebGL: FimResourceMetrics;

  /** WebGL shaders */
  glShader: FimResourceMetrics;

  /** WebGL textures */
  glTexture: FimResourceMetrics;
}

/** Metrics tracked on each resource category in the FIM library */
export interface FimResourceMetrics {
  /** Number of objects in this resource category */
  readonly instances: number;

  /** Memory consumed by objects in this resource category, excluding WebGL memory, in bytes */
  readonly nonGLMemory: number;

  /** WebGL memory consumed by objects in this resource category, in bytes */
  readonly glMemory: number;
}
