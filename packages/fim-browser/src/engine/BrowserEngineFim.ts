// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineImage } from './BrowserEngineImage';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { CoreBrowserCanvasWebGL } from '../core/CoreBrowserCanvasWebGL';
import { FimDimensions, FimEngineOptions, FimImageOptions, FimReleaseResourcesFlags } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasWebGL, EngineFim } from '@leosingleton/fim/internals';

export class BrowserEngineFim extends EngineFim<BrowserEngineImage> {
  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    // TODO
  }

  protected createEngineImage(dimensions: FimDimensions, options: FimImageOptions, imageName?: string):
      BrowserEngineImage {
    return new BrowserEngineImage(this, dimensions, options, imageName);
  }

  protected createCoreCanvas2D(dimensions: FimDimensions, handle: string, engineOptions: FimEngineOptions,
      imageOptions: FimImageOptions): CoreCanvas2D {
    // TODO: Support OffscreenCanvas
    return new CoreBrowserCanvas2D(dimensions, handle, engineOptions, imageOptions);
  }

  protected createCoreCanvasWebGL(dimensions: FimDimensions, handle: string, engineOptions: FimEngineOptions,
      imageOptions: FimImageOptions): CoreCanvasWebGL {
    // TODO: Support OffscreenCanvas
    return new CoreBrowserCanvasWebGL(dimensions, handle, engineOptions, imageOptions);
  }
}
