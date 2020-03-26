// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBitsPerPixel, FimTextureSampling } from '@leosingleton/fim';
import { CoreCanvasOptions, CoreTextureOptions } from '@leosingleton/fim/internals';

/** Default canvas options for unit tests */
export const canvasOptions: CoreCanvasOptions = {};

/** Default texture options for unit tests */
export const textureOptions: CoreTextureOptions = {
  bpp: FimBitsPerPixel.BPP8,
  isReadOnly: false,
  sampling: FimTextureSampling.Nearest
};
