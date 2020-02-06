// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageOptions, defaultImageOptions, mergeImageOptions } from '../FimImageOptions';
import { FimTextureSampling } from '../FimTextureSampling';
import { FimBitsPerPixel } from '../../primitives/FimBitsPerPixel';
import { FimColorChannels } from '../../primitives/FimColorChannels';

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
      channels: FimColorChannels.RGBA,
      sampling: FimTextureSampling.Nearest,
      backup: false,
      allowOversized: true,
      glReadOnly: true,
      downscale: 1,
      glDownscale: 0.5,
    };
    const child: FimImageOptions = {
      bpp: FimBitsPerPixel.BPP8,
      channels: FimColorChannels.RGB,
      sampling: FimTextureSampling.Linear,
      backup: true,
      allowOversized: false,
      glReadOnly: false,
      downscale: 0,
      glDownscale: 0.1
    };
    const options = mergeImageOptions(parent, child);
    expect(options.bpp).toEqual(child.bpp);
    expect(options.channels).toEqual(child.channels);
    expect(options.sampling).toEqual(child.sampling);
    expect(options.backup).toEqual(child.backup);
    expect(options.allowOversized).toEqual(child.allowOversized);
    expect(options.glReadOnly).toEqual(child.glReadOnly);
    expect(options.downscale).toEqual(child.downscale);
    expect(options.glDownscale).toEqual(child.glDownscale);
  });

});
