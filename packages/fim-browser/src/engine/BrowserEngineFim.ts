// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineImage } from './BrowserEngineImage';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { CoreBrowserCanvasWebGL } from '../core/CoreBrowserCanvasWebGL';
import { CoreBrowserOffscreenCanvas2D } from '../core/CoreBrowserOffscreenCanvas2D';
import { CoreBrowserOffscreenCanvasWebGL } from '../core/CoreBrowserOffscreenCanvasWebGL';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasWebGL, EngineFim, EngineShader } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

export class BrowserEngineFim extends EngineFim<BrowserEngineImage, EngineShader> {
  protected createEngineImage(dimensions: FimDimensions, options: FimImageOptions, imageName?: string):
      BrowserEngineImage {
    return new BrowserEngineImage(this, dimensions, options, imageName);
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

  public createCoreCanvas2D(dimensions: FimDimensions, handle: string, options: FimImageOptions): CoreCanvas2D {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return new CoreBrowserOffscreenCanvas2D(dimensions, handle, this.engineOptions, options);
    } else {
      return new CoreBrowserCanvas2D(dimensions, handle, this.engineOptions, options);
    }
  }

  public createCoreCanvasWebGL(dimensions: FimDimensions, handle: string, options: FimImageOptions): CoreCanvasWebGL {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return new CoreBrowserOffscreenCanvasWebGL(dimensions, handle, this.engineOptions, options);
    } else {
      return new CoreBrowserCanvasWebGL(dimensions, handle, this.engineOptions, options);
    }
  }
}
