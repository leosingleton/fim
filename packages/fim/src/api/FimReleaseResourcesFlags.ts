// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Flags for FimObject.releaseResources() */
export const enum FimReleaseResourcesFlags {
  /** Releases memory consumed by DOM canvas objects */
  DomCanvas = (1 << 0),

  /** Releases memory consumed by OffscreenCanvas objects */
  OffscreenCanvas = (1 << 1),

  /** Releases memory consumed by any type of non-WebGL canvas */
  Canvas = DomCanvas | OffscreenCanvas,

  /** Releases WebGL texture memory */
  WebGLTexture = (1 << 2),

  /** Releases all WebGL resources */
  WebGL = (1 << 3),

  /** Releases all resources, WebGL and non-WebGL */
  All = Canvas | WebGL
}
