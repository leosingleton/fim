// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngine } from '../NodeEngine';
import { FimReleaseResourcesFlags } from '@leosingleton/fim';

describe('NodeEngine', () => {

  it('Creates, releases, and disposes', () => {
    const eng = new NodeEngine();
    eng.releaseResources(FimReleaseResourcesFlags.All);
    eng.dispose();
  });

});
