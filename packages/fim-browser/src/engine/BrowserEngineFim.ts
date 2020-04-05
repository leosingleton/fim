// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineImage } from './BrowserEngineImage';
import { fileDownload } from './FileDownload';
import { FimBrowser } from '../api/FimBrowser';
import { CoreBrowserDomCanvas2D } from '../core/CoreBrowserDomCanvas2D';
import { CoreBrowserDomCanvasWebGL } from '../core/CoreBrowserDomCanvasWebGL';
import { CoreBrowserDomImageFile } from '../core/CoreBrowserDomImageFile';
import { CoreBrowserImageFile } from '../core/CoreBrowserImageFile';
import { CoreBrowserOffscreenCanvas2D } from '../core/CoreBrowserOffscreenCanvas2D';
import { CoreBrowserOffscreenCanvasWebGL } from '../core/CoreBrowserOffscreenCanvasWebGL';
import { CoreBrowserOffscreenImageFile } from '../core/CoreBrowserOffscreenImageFile';
import { FimDimensions, FimImageOptions, FimObject } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFimBase, EngineShader,
  fileToName } from '@leosingleton/fim/internals';
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

  public getCoreImageFile(): CoreBrowserImageFile {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return CoreBrowserOffscreenImageFile.instance;
    } else {
      return CoreBrowserDomImageFile.instance;
    }
  }

  public createCoreCanvas2D(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvas2D {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return new CoreBrowserOffscreenCanvas2D(options, dimensions, handle, this.engineOptions);
    } else {
      return new CoreBrowserDomCanvas2D(options, dimensions, handle, this.engineOptions);
    }
  }

  public createCoreCanvasWebGL(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvasWebGL {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return new CoreBrowserOffscreenCanvasWebGL(options, dimensions, handle, this.engineOptions);
    } else {
      return new CoreBrowserDomCanvasWebGL(options, dimensions, handle, this.engineOptions);
    }
  }

  public async createImageFromPngFileAsync(pngUrl: string, options?: FimImageOptions, name?: string,
      parent?: FimObject): Promise<BrowserEngineImage> {
    const pngFile = await fileDownload(pngUrl);
    return this.createImageFromPngAsync(pngFile, options, name ?? fileToName(pngUrl), parent);
  }

  public async createImageFromJpegFileAsync(jpegUrl: string, options?: FimImageOptions, name?: string,
      parent?: FimObject): Promise<BrowserEngineImage> {
    const jpegFile = await fileDownload(jpegUrl);
    return this.createImageFromJpegAsync(jpegFile, options, name ?? fileToName(jpegUrl), parent);
  }
}
