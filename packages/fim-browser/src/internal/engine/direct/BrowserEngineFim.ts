// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimReleaseResourcesFlags } from '@leosingleton/fim';
import { EngineFim } from '@leosingleton/fim/internals';

export class BrowserEngineFim extends EngineFim {
  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    // TODO
  }
}
