// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBitsPerPixel, FimTextureSampling } from '@leosingleton/fim';
import { CoreCanvasOptions, CoreTextureOptions } from '@leosingleton/fim/internals';

export const canvasOptions: CoreCanvasOptions = {
  downscale: 1
};

/** Default texture options for unit tests */
export const textureOptions: CoreTextureOptions = {
  bpp: FimBitsPerPixel.BPP8,
  downscale: 1,
  isReadOnly: false,
  sampling: FimTextureSampling.Nearest
};
