// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/**
 * Texture sampling options for WebGL minification and magnification
 *
 * (WebGL supports other options around mipmaps, but these don't apply due to the way FIM uses WebGL textures as
 * frequently-changing canvases)
 */
export const enum FimTextureSampling {
  /** Reads and interpolates up to four pixels */
  Linear,

  /** Reads the value of a single pixel */
  Nearest
}
