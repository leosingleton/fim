// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Options for `CoreCanvas` and its derived classes */
export interface CoreCanvasOptions {
  /**
   * A scaling value ranging from [1.0, 0.0) which causes the underlying canvas to be smaller than the reported
   * canvas size. A value of 1.0 indicates no downscaling. Downscaling can improve performance and reduce memory
   * consumption.
   */
  readonly downscale: number;
}
