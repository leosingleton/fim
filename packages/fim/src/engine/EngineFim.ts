// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { EngineShader } from './EngineShader';
import { Fim } from '../api/Fim';
import { FimCapabilities } from '../api/FimCapabilities';
import { FimEngineOptions, defaultEngineOptions } from '../api/FimEngineOptions';
import { FimImageOptions, defaultImageOptions } from '../api/FimImageOptions';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { FimDimensions } from '../primitives/FimDimensions';
import { deepCopy } from '@leosingleton/commonlibs';

/** Client implementation of the Fim interface */
export abstract class EngineFim<TEngineImage extends EngineImage, TEngineShader extends EngineShader>
    extends EngineObject implements Fim<TEngineImage, TEngineShader> {
  /**
   * Constructor
   * @param maxImageDimensions Maximum dimensions of any image
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  public constructor(maxImageDimensions: FimDimensions, objectName?: string) {
    super(EngineObjectType.Fim, objectName);
    this.maxImageDimensions = maxImageDimensions;

    // Initialize options to library defaults. The properties are public, so API clients may change them after FIM
    // creation.
    this.engineOptions = deepCopy(defaultEngineOptions);
    this.defaultImageOptions = deepCopy(defaultImageOptions);

    // Detect the browser and GPU's capabilities. This is a bit hacky, but works by:
    //  1. Initializing the non-GPU capabilities. This is needed to call createCoreCanvasWebGL().
    //  2. Creating a tiny, temporary WebGL canvas. We do this to ensure the canvas is smaller than the maximum render
    //      buffer size, but have a chicken-and-egg problem of not knowing the size without discovering capabilities.
    //  3. We discover GPU capabilities from the temporary WebGL canvas. The properties on the capabilities object are
    //      readonly, so we force copy them over with any typecasts.
    this.capabilities = {
      supportsOffscreenCanvas: (typeof OffscreenCanvas !== 'undefined'),
      glVersion: '',
      glShadingLanguageVersion: '',
      glVendor: '',
      glRenderer: '',
      glUnmaskedVendor: '',
      glUnmaskedRenderer: '',
      glMaxRenderBufferSize: 0,
      glMaxTextureImageUnits: 0,
      glMaxTextureSize: 0,
      glExtensions: []
    };
    const tinyCanvas = this.createCoreCanvasWebGL(FimDimensions.fromWidthHeight(10, 10),
      `${this.handle}/DetectCapabilities`, {});
    try {
      const glCapabilities = tinyCanvas.detectCapabilities();
      for (const prop in glCapabilities) {
        (this.capabilities as any)[prop] = (glCapabilities as any)[prop];
      }
    } finally {
      tinyCanvas.dispose();
    }
  }

  public readonly maxImageDimensions: FimDimensions;
  public readonly engineOptions: FimEngineOptions;
  public readonly defaultImageOptions: FimImageOptions;
  public readonly capabilities: FimCapabilities;

  // Force parentObject to be a more specific type
  public parentObject: never;

  /** Returns the WebGL canvas for running shaders. Creates the canvas on first use. */
  public getWebGLCanvas(): CoreCanvasWebGL {
    const me = this;

    // The WebGL canvas is created on first use and may be disposed prematurely via releaseResources(). If it is already
    // allocated, simply return it.
    if (me.glCanvas) {
      return me.glCanvas;
    }

    // Mobile and older GPUs may have limits as low as 2048x2048 for render buffers. First, read the device capabilities
    // to ensure we do not exceed the GPU's capabilities
    const caps = me.capabilities;
    let maxDimension = caps.glMaxRenderBufferSize;

    // The NVIDIA Quadro NVS 295 claims to have a maxRenderBufferSize of 8192 (the same as its maxTextureSize), but is
    // unstable if you create a WebGL canvas larger than 2048x2048. Ignore its capabilities and enforce a lower
    // maximum limit. (Workaround for Yuri's old PC)
    if (caps.glUnmaskedVendor.indexOf('NVS 295') >= 0) {
      maxDimension = 2048;
    }

    // If a lower render buffer limit was set for debugging, use that instead
    const debugMaxDimension = me.engineOptions.maxGLRenderBufferSize;
    if (debugMaxDimension > 0) {
      maxDimension = Math.min(maxDimension, debugMaxDimension);
    }

    // Create the WebGL canvas. If the requested dimensions exceed the maximum we calculated, automatically downscale
    // the requested resolution.
    const glDimensions = me.maxImageDimensions.downscaleToMaxDimension(maxDimension);
    const glCanvas = me.glCanvas = me.createCoreCanvasWebGL(glDimensions, me.handle, {});
    return glCanvas;
  }

  /** The WebGL canvas created by getWebGLCanvas() */
  private glCanvas: CoreCanvasWebGL;

  protected releaseOwnResources(flags: FimReleaseResourcesFlags): void {
    if ((flags & FimReleaseResourcesFlags.WebGL) && this.glCanvas) {
      this.glCanvas.dispose();
      this.glCanvas = undefined;
    }
  }

  public createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string): TEngineImage {
    this.ensureNotDisposed();

    dimensions = dimensions ?? this.maxImageDimensions;
    options = options ?? {};

    return this.createEngineImage(dimensions, options, imageName);
  }

  /** Derived classes must implement this method to call the TEngineImage constructor */
  protected abstract createEngineImage(dimensions: FimDimensions, options: FimImageOptions, imageName?: string):
    TEngineImage;

  /** Derived classes must implement this method to call the CoreCanvas2D constructor */
  protected abstract createCoreCanvas2D(dimensions: FimDimensions, handle: string, options: FimImageOptions):
    CoreCanvas2D;

  /** Derived classes must implement this method to call the CoreCanvasWebGL constructor */
  protected abstract createCoreCanvasWebGL(dimensions: FimDimensions, handle: string, options: FimImageOptions):
    CoreCanvasWebGL;
}
