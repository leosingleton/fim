// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineFim } from '../NodeEngineFim';
import { FimReleaseResourcesFlags } from '@leosingleton/fim';

describe('NodeEngineFim', () => {

  it('Creates, releases, and disposes', () => {
    const eng = new NodeEngineFim();
    eng.releaseResources(FimReleaseResourcesFlags.All);
    eng.dispose();
  });

});
