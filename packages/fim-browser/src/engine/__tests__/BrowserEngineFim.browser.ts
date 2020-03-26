// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineFim } from '../BrowserEngineFim';
import { FimDimensions, FimReleaseResourcesFlags } from '@leosingleton/fim';

describe('BrowserEngineFim', () => {

  it('Creates, releases, and disposes', () => {
    const eng = new BrowserEngineFim(FimDimensions.fromWidthHeight(100, 100));
    eng.releaseResources(FimReleaseResourcesFlags.All);
    eng.dispose();
  });

});
