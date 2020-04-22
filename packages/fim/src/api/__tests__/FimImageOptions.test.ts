// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageOptions, defaultImageOptions, mergeImageOptions } from '../FimImageOptions';
import { FimBitsPerPixel } from '../../primitives/FimBitsPerPixel';
import { FimTextureSampling } from '../../primitives/FimTextureSampling';

describe('FimImageOptions', () => {

  it('Merges defaults with undefined child', () => {
    const options = mergeImageOptions(defaultImageOptions, undefined);
    expect(options).toEqual(defaultImageOptions);
  });

  it('Merges defaults with empty child', () => {
    const options = mergeImageOptions(defaultImageOptions, undefined);
    expect(options).toEqual(defaultImageOptions);
  });

  it('Child options win merge', () => {
    const parent: FimImageOptions = {
      bpp: FimBitsPerPixel.BPP16,
      sampling: FimTextureSampling.Nearest,
      autoBackup: false,
      oversizedReadOnly: true,
      downscale: 1,
      glDownscale: 0.5,
    };
    const child: FimImageOptions = {
      bpp: FimBitsPerPixel.BPP8,
      sampling: FimTextureSampling.Linear,
      autoBackup: true,
      oversizedReadOnly: false,
      downscale: 0,
      glDownscale: 0.1
    };
    const options = mergeImageOptions(parent, child);
    expect(options.bpp).toEqual(child.bpp);
    expect(options.sampling).toEqual(child.sampling);
    expect(options.autoBackup).toEqual(child.autoBackup);
    expect(options.oversizedReadOnly).toEqual(child.oversizedReadOnly);
    expect(options.downscale).toEqual(child.downscale);
    expect(options.glDownscale).toEqual(child.glDownscale);
  });

});
