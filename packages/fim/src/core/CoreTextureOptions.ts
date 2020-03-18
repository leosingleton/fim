// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimTextureSampling } from '../primitives/FimTextureSampling';

/** Options for `CoreTexture` */
export interface CoreTextureOptions {
  /** Bits per pixel */
  readonly bpp: FimBitsPerPixel;

  /** Texture sampling options for WebGL minification and magnification */
  readonly sampling: FimTextureSampling;

  /**
   * Creates a WebGL texture that is read-only. According to WebGL docs, this is a hint that may offer some performance
   * optimizations if the image is not going to be used to store the output of a WebGL shader.
   */
  readonly isReadOnly: boolean;

  /**
   * A scaling value ranging from [1.0, 0.0) which causes the underlying WebGL texture to be smaller than the reported
   * texture size. A value of 1.0 indicates no downscaling. Downscaling can improve performance and reduce memory
   * consumption.
   */
  readonly downscale: number;
}
