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

  protected getCapabilityLogicalCpuCount(): number {
    // Safari and some older browsers don't support hardwareConcurrency. For these, return zero.
    return navigator.hardwareConcurrency ?? 0;
  }

  protected getCapabilityMemory(): number {
    // deviceMemory is experimental, but many browsers return the memory in GB, rounded down to a power of two
    const memory = (navigator as any).deviceMemory;
    if (memory) {
      return memory * 1024 * 1024 * 1024;
    } else {
      // Either the browser doesn't support it, or we are running in a development environment without HTTPS
      return 0;
    }
  }

  protected getMaxCanvasSize(): number {
    // https://github.com/jhildenbiddle/canvas-size has a lot of good data on browser capabilities. The checks below are
    // a bit more conservative, as most of the limits are around total area, but FIM enforces automatic downscale based
    // on a single dimension.

    const uad = (navigator as any).userAgentData as NavigatorUAData;
    if (uad) {
      for (const brand of uad.brands) {
        if (brand.brand.indexOf('Chrome') !== -1 || brand.brand.indexOf('Edge') !== -1) {
          // Chrome for desktop and some Android devices support 16,384 x 16,384, but some Android devices have lower
          // limits. 8,192 x 8,192 should be safe on mobile.
          return uad.mobile ? 8192 : 16384;
        }
      }
    }

    const uas = navigator.userAgent;
    if (uas.indexOf('Safari') !== -1 && uas.indexOf('Chrome') === -1) {
      if (uas.indexOf('iPhone') !== -1 || uas.indexOf('iPad') !== -1) {
        // iOS Safari notably limits canvases to 16 MB. Assume 4,096 x 4,096 is the safe dimensions.
        return 4096;
      } else {
        // Safari on desktop supports 16,384 x 16,384.
        return 16384;
      }
    }

    // Firefox supports 11,180 x 11,180
    if (uas.indexOf('Firefox') !== -1) {
      return 11180;
    }

    // For older or unknown browsers, assume 4,096 x 4,096 is safe.
    return 4096;
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


//
// Type definitions for the experimental User-Agent Client Hints API
// WICG Spec: https://wicg.github.io/ua-client-hints
//

// https://wicg.github.io/ua-client-hints/#dictdef-navigatoruabrandversion
interface NavigatorUABrandVersion {
  readonly brand: string;
  readonly version: string;
}

// https://wicg.github.io/ua-client-hints/#dictdef-uadatavalues
interface UADataValues {
  readonly brands?: NavigatorUABrandVersion[];
  readonly mobile?: boolean;
  readonly platform?: string;
  readonly architecture?: string;
  readonly bitness?: string;
  readonly model?: string;
  readonly platformVersion?: string;
  /** @deprecated in favour of fullVersionList */
  readonly uaFullVersion?: string;
  readonly fullVersionList?: NavigatorUABrandVersion[];
  readonly wow64?: boolean;
}

// https://wicg.github.io/ua-client-hints/#dictdef-ualowentropyjson
interface UALowEntropyJSON {
  readonly brands: NavigatorUABrandVersion[];
  readonly mobile: boolean;
  readonly platform: string;
}

// https://wicg.github.io/ua-client-hints/#navigatoruadata
interface NavigatorUAData extends UALowEntropyJSON {
  getHighEntropyValues(hints: string[]): Promise<UADataValues>;
  toJSON(): UALowEntropyJSON;
}
