// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Flags for FimObject.releaseResources() */
export const enum FimReleaseResourcesFlags {
  /** Releases memory consumed by any type of non-WebGL canvas, both DOM and OffscreenCanvas */
  Canvas = (1 << 0),

  /** Releases WebGL shaders */
  WebGLShader = (1 << 1),

  /** Releases WebGL texture memory */
  WebGLTexture = (1 << 2),

  /** Releases all WebGL resources, including WebGL canvases */
  WebGL = (1 << 3) | WebGLTexture,

  /** Releases all resources, WebGL and non-WebGL */
  All = Canvas | WebGL
}
