// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Enum for `OptimizerBase.recordImageRead()` and `OptimizerBase.recordImageWrite()` */
export const enum ImageFormat {
  /** 2D canvas was read or written to */
  Canvas,

  /** WebGL texture was read or written to */
  Texture
}
