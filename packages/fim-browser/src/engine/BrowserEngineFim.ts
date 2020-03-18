// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineImage } from './BrowserEngineImage';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { CoreBrowserCanvasWebGL } from '../core/CoreBrowserCanvasWebGL';
import { CoreBrowserOffscreenCanvas2D } from '../core/CoreBrowserOffscreenCanvas2D';
import { CoreBrowserOffscreenCanvasWebGL } from '../core/CoreBrowserOffscreenCanvasWebGL';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFim, EngineShader } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

export class BrowserEngineFim extends EngineFim<BrowserEngineImage, EngineShader> {
  protected createEngineImage(options: FimImageOptions, dimensions: FimDimensions, imageName?: string):
      BrowserEngineImage {
    return new BrowserEngineImage(this, options, dimensions, imageName);
  }

  protected createEngineImageFromPngAsync(pngFile: Uint8Array, options: FimImageOptions, imageName?: string):
      Promise<BrowserEngineImage> {
    return BrowserEngineImage.createFromPngAsync(this, pngFile, options, imageName);
  }

  protected createEngineImageFromJpegAsync(jpegFile: Uint8Array, options: FimImageOptions, imageName?: string):
      Promise<BrowserEngineImage> {
    return BrowserEngineImage.createFromJpegAsync(this, jpegFile, options, imageName);
  }

  public createGLShader(fragmentShader: GlslShader, vertexShader?: GlslShader, shaderName?: string): EngineShader {
    return new EngineShader(this, fragmentShader, vertexShader, shaderName);
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
