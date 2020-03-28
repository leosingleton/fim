// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineImage } from './BrowserEngineImage';
import { FimBrowser } from '../api/FimBrowser';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { CoreBrowserCanvasWebGL } from '../core/CoreBrowserCanvasWebGL';
import { CoreBrowserOffscreenCanvas2D } from '../core/CoreBrowserOffscreenCanvas2D';
import { CoreBrowserOffscreenCanvasWebGL } from '../core/CoreBrowserOffscreenCanvasWebGL';
import { FimDimensions, FimImageOptions, FimObject } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFimBase,
  EngineShader } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

export class BrowserEngineFim extends EngineFimBase<BrowserEngineImage, EngineShader> implements FimBrowser {
  protected createEngineImage(parent: FimObject, options: FimImageOptions, dimensions: FimDimensions, name?: string):
      BrowserEngineImage {
    return new BrowserEngineImage(parent, options, dimensions, name);
  }

  protected createEngineImageFromPngAsync(pngFile: Uint8Array, parent: FimObject, options: FimImageOptions,
      name?: string): Promise<BrowserEngineImage> {
    return BrowserEngineImage.createFromPngAsync(parent, pngFile, options, name);
  }

  protected createEngineImageFromJpegAsync(jpegFile: Uint8Array, parent: FimObject, options: FimImageOptions,
      name?: string): Promise<BrowserEngineImage> {
    return BrowserEngineImage.createFromJpegAsync(parent, jpegFile, options, name);
  }

  protected createEngineGLShader(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader,
      name?: string): EngineShader {
    return new EngineShader(parent, fragmentShader, vertexShader, name);
  }

  public createCoreCanvas2D(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvas2D {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return new CoreBrowserOffscreenCanvas2D(options, dimensions, handle, this.engineOptions);
    } else {
      return new CoreBrowserCanvas2D(options, dimensions, handle, this.engineOptions);
    }
  }

  public createCoreCanvasWebGL(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvasWebGL {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return new CoreBrowserOffscreenCanvasWebGL(options, dimensions, handle, this.engineOptions);
    } else {
      return new CoreBrowserCanvasWebGL(options, dimensions, handle, this.engineOptions);
    }
  }
}
