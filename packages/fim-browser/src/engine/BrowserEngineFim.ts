// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineImage } from './BrowserEngineImage';
import { FimDimensions, FimImageOptions, FimReleaseResourcesFlags } from '@leosingleton/fim';
import { EngineFim } from '@leosingleton/fim/internals';

export class BrowserEngineFim extends EngineFim<BrowserEngineImage> {
  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    // TODO
  }

  protected createEngineImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string):
      BrowserEngineImage {
    return new BrowserEngineImage(this, dimensions, options, imageName);
  }
}
