// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineImage } from './BrowserEngineImage';
import { FimBrowser } from '../api/FimBrowser';
import { CoreBrowserDomCanvas2D } from '../core/CoreBrowserDomCanvas2D';
import { CoreBrowserDomCanvasWebGL } from '../core/CoreBrowserDomCanvasWebGL';
import { CoreBrowserOffscreenCanvas2D } from '../core/CoreBrowserOffscreenCanvas2D';
import { CoreBrowserOffscreenCanvasWebGL } from '../core/CoreBrowserOffscreenCanvasWebGL';
import { fileReaderAsync } from '../core/FileReader';
import { loadFromBlobAsync, loadFromFileAsync } from '../core/ImageLoader';
import { FimDimensions, FimImageOptions, FimObject } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFimBase,
  EngineShader } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

/** Implementation of `EngineFim` for web browsers */
export class BrowserEngineFim extends EngineFimBase<BrowserEngineImage, EngineShader> implements FimBrowser {
  /**
   * Constructor
   * @param name An optional name specified when creating the object to help with debugging
   */
  public constructor(name?: string) {
    super(fileReaderAsync, loadFromFileAsync, name);
  }

  protected getCapabilityUserAgent(): string {
    return navigator.userAgent;
  }

  protected getCapabilityMemory(): number {
    // deviceMemory is experimental, but many browsers return the memory in GB, rounded down to a power of two
    const memory = (navigator as any).deviceMemory;
    if (memory) {
      return memory * 1024 * 1024 * 1024;
    } else {
      return 0;
    }
  }

  protected createEngineImage(parent: FimObject, dimensions: FimDimensions, options: FimImageOptions, name?: string):
      BrowserEngineImage {
    return new BrowserEngineImage(parent, dimensions, options, name);
  }

  protected createEngineGLShader(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader,
      name?: string): EngineShader {
    return new EngineShader(parent, fragmentShader, vertexShader, name);
  }

  public createCoreCanvas2D(dimensions: FimDimensions, options: CoreCanvasOptions, handle: string): CoreCanvas2D {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return new CoreBrowserOffscreenCanvas2D(dimensions, options, handle, this.engineOptions);
    } else {
      return new CoreBrowserDomCanvas2D(dimensions, options, handle, this.engineOptions);
    }
  }

  public createCoreCanvasWebGL(dimensions: FimDimensions, options: CoreCanvasOptions, handle: string): CoreCanvasWebGL {
    if (!this.engineOptions.disableOffscreenCanvas) {
      return new CoreBrowserOffscreenCanvasWebGL(dimensions, options, handle, this.engineOptions);
    } else {
      return new CoreBrowserDomCanvasWebGL(dimensions, options, handle, this.engineOptions);
    }
  }

  public async createImageFromBlobAsync(blob: Blob, options?: FimImageOptions, name?: string, parent?: FimObject):
      Promise<BrowserEngineImage> {
    const me = this;
    me.ensureNotDisposed();

    let result: BrowserEngineImage;
    await loadFromBlobAsync(blob, image => {
      result = me.createEngineImage(parent ?? this, FimDimensions.fromObject(image), options ?? {}, name);
      result.loadFromImage(image);
    });

    return result;
  }
}
