// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Object to return the current state of resource usage in an instance of the FIM library */
export interface FimResourceUsage {
  /** Index values are defined as string in the `FimResource` enum */
  readonly [resource: string]: FimResourceMetrics;
}

/** Resource categories measured by the FIM library */
export const enum FimResource {
  /** 2D canvas resources, including `OffscreenCanvas` objects */
  Canvas2D = 'c2d',

  /** WebGL canvas resources, including `OffscreenCanvas` objects */
  CanvasWebGL = 'cgl',

  /** WebGL shaders */
  GLShader = 'shd',

  /** WebGL textures */
  GLTexture = 'txt',

  /** Totals of all resource categories */
  Totals = 'tot'
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
