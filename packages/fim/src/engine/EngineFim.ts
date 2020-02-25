// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { Fim } from '../api/Fim';
import { FimCapabilities } from '../api/FimCapabilities';
import { FimEngineOptions, defaultEngineOptions } from '../api/FimEngineOptions';
import { FimImageOptions, defaultImageOptions } from '../api/FimImageOptions';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { FimDimensions } from '../primitives/FimDimensions';
import { deepCopy } from '@leosingleton/commonlibs';

/** Client implementation of the Fim interface */
export abstract class EngineFim<TEngineImage extends EngineImage> extends EngineObject implements Fim<TEngineImage> {
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
    const tinyCanvas = this.createCoreCanvasWebGL(FimDimensions.fromWidthHeight(10, 10), 'DetectCapabilities',
      this.engineOptions, this.defaultImageOptions);
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
  protected abstract createCoreCanvas2D(dimensions: FimDimensions, handle: string, engineOptions: FimEngineOptions,
    imageOptions: FimImageOptions): CoreCanvas2D;

  /** Derived classes must implement this method to call the CoreCanvasWebGL constructor */
  protected abstract createCoreCanvasWebGL(dimensions: FimDimensions, handle: string, engineOptions: FimEngineOptions,
    imageOptions: FimImageOptions): CoreCanvasWebGL;
}
