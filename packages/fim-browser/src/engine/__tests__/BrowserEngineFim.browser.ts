// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineFim } from '../BrowserEngineFim';
import { FimReleaseResourcesFlags } from '@leosingleton/fim';

describe('BrowserEngineFim', () => {

  it('Creates, releases, and disposes', () => {
    const eng = new BrowserEngineFim();
    eng.releaseResources(FimReleaseResourcesFlags.All);
    eng.dispose();
  });

});
