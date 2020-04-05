// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { EngineShader } from './EngineShader';
import { OptimizerBase } from './optimizer/OptimizerBase';
import { OptimizerNull } from './optimizer/OptimizerNull';
import { ResourceTracker } from './optimizer/ResourceTracker';
import { FimBase } from '../api/Fim';
import { FimCapabilities } from '../api/FimCapabilities';
import { FimEngineOptions, defaultEngineOptions } from '../api/FimEngineOptions';
import { FimImageOptions, defaultImageOptions } from '../api/FimImageOptions';
import { FimObject } from '../api/FimObject';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimResourceUsage, FimResourceMetrics } from '../api/FimResourceUsage';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasOptions } from '../core/CoreCanvasOptions';
import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { CoreImageLoader } from '../core/CoreImageLoader';
import { CoreMimeType } from '../core/CoreMimeType';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { deepCopy } from '@leosingleton/commonlibs';
import { GlslShader } from 'webpack-glsl-minify';

/** Shorthand for `EngineFimBase` with the non-platform-specfic implementations of `TEngineImage` and `TEngineShader` */
export type EngineFim = EngineFimBase<EngineImage, EngineShader>;

/** Client implementation of the `Fim` interface */
export abstract class EngineFimBase<TEngineImage extends EngineImage, TEngineShader extends EngineShader>
    extends EngineObject implements FimBase<TEngineImage, TEngineShader> {
  /**
   * Constructor
   * @param imageLoader `CoreImageLoader` implementation for reading and writing to and from PNG and JPEG formats
   * @param maxImageDimensions Maximum dimensions of any image. If unspecified, defaults to the maximum image size
   *    supported by the WebGL capabilities of the browser and GPU.
   * @param name An optional name specified when creating the object to help with debugging
   */
  public constructor(public readonly imageLoader: CoreImageLoader, maxImageDimensions?: FimDimensions, name?: string) {
    super(EngineObjectType.Fim, name);
    this.resources = new ResourceTracker(this);
    this.optimizer = new OptimizerNull(this);

    // Initialize options to library defaults. The properties are public, so API clients may change them after FIM
    // creation.
    const engineOptions = this.engineOptions = deepCopy(defaultEngineOptions);
    const imageOptions = this.defaultImageOptions = deepCopy(defaultImageOptions);

    // Detect the browser and GPU's capabilities. This is a bit hacky, but works by:
    //  1. Initializing the non-GPU capabilities. This is needed to call createCoreCanvasWebGL().
    //  2. Creating a tiny, temporary WebGL canvas. We do this to ensure the canvas is smaller than the maximum render
    //      buffer size, but have a chicken-and-egg problem of not knowing the size without discovering capabilities.
    //  3. We discover GPU capabilities from the temporary WebGL canvas. The properties on the capabilities object are
    //      readonly, so we force copy them over with any typecasts.
    const capabilities: FimCapabilities = this.capabilities = {
      supportsOffscreenCanvas: (typeof OffscreenCanvas !== 'undefined'),
      supportsImageBitmap: (typeof createImageBitmap !== 'undefined'),
      glVersion: '',
      glShadingLanguageVersion: '',
      glVendor: '',
      glRenderer: '',
      glUnmaskedVendor: '',
      glUnmaskedRenderer: '',
      glMaxRenderBufferSize: 0,
      glMaxTextureImageUnits: 0,
      glMaxTextureSize: 0,
      glMaxFragmentUniformVectors: 0,
      glMaxVertexUniformVectors: 0,
      glExtensions: [],
      glTextureDepthsLinear: [],
      glTextureDepthsNearest: []
    };
    const tinyCanvas = this.createCoreCanvasWebGL({}, FimDimensions.fromWidthHeight(10, 10),
      `${this.handle}/DetectCapabilities`);
    try {
      const glCapabilities = tinyCanvas.detectCapabilities();
      for (const prop in glCapabilities) {
        (capabilities as any)[prop] = (glCapabilities as any)[prop];
      }

      // Also set the default imageOptions to a valid color depth
      imageOptions.bpp = tinyCanvas.getDefaultColorDepth();
    } finally {
      tinyCanvas.dispose();
    }

    // Limit engine options to detected capabilities
    engineOptions.disableOffscreenCanvas = !capabilities.supportsOffscreenCanvas;
    engineOptions.disableImageBitmap = !capabilities.supportsImageBitmap;
    engineOptions.maxGLRenderBufferSize = capabilities.glMaxRenderBufferSize;
    engineOptions.maxGLTextureSize = capabilities.glMaxTextureSize;

    // Set the maximum image dimensions to the specified value. If unspecified, default to the WebGL capabilities.
    const maxDimension = Math.min(capabilities.glMaxRenderBufferSize, capabilities.glMaxTextureSize);
    this.maxImageDimensions = maxImageDimensions ?? FimDimensions.fromSquareDimension(maxDimension);
  }

  public readonly maxImageDimensions: FimDimensions;
  public readonly engineOptions: FimEngineOptions;
  public readonly defaultImageOptions: FimImageOptions;
  public readonly capabilities: FimCapabilities;

  // Force parentObject to be a more specific type
  public parentObject: never;

  /** Resource tracking within `EngineFim` is contained in a separate object with 1:1 mapping for code readability */
  public readonly resources: ResourceTracker;

  /** Memory optimization within `EngineFim` is contained in a separate object with 1:1 mapping for code readability */
  public readonly optimizer: OptimizerBase;

  /**
   * Writes a trace message to the console. This function is a no-op if tracing is disabled in the engine options.
   * @param object Object handle to log for the message
   * @param message Message to log
   */
  public writeTrace(object: EngineObject, message: string): void {
    this.writeMessageInternal(object, message, this.engineOptions.showTracing);
  }

  /**
   * Writes a warning message to the console. This function is a no-op if warnings and tracing are disabled in the
   * engine options.
   * @param object Object handle to log for the message
   * @param message Message to log
   */
  public writeWarning(object: EngineObject, message: string): void {
    this.writeMessageInternal(object, `<WARNING> ${message}`, this.engineOptions.showTracing ||
      this.engineOptions.showWarnings);
  }

  /**
   * Internal function to writes a message to the console
   * @param object Object handle to log for the message
   * @param message Message to log
   * @param show Only writes if `show` is `true`. Otherwise this function is a no-op.
   */
  private writeMessageInternal(object: EngineObject, message: string, show: boolean): void {
    if (show) {
      console.log(`${object.handle}: ${message}`);
    }
  }

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
    const glDimensions = me.maxImageDimensions.fitInsideSquare(maxDimension).toFloor();
    me.optimizer.reserveCanvasMemory(glDimensions.getArea() * 4);
    const glCanvas = me.glCanvas = me.createCoreCanvasWebGL(me.getGLCanvasOptions(), glDimensions,
      `${me.handle}/WebGLCanvas`);

    // Register context lost handler and restored handlers. On context lost, we must free all textures and shaders. They
    // get recreated again on first use.
    glCanvas.registerContextLostHandler(() => this.onContextLost());
    glCanvas.registerContextRestoredHandler(() => this.onContextRestored());

    // Record the WebGL canvas creation
    me.resources.recordCreate(me, glCanvas);

    return glCanvas;
  }

  /** Calculates and returns the `CoreCanvasOptions` for creating a new WebGL canvas */
  public getGLCanvasOptions(): CoreCanvasOptions {
    //const options = mergeImageOptions(defaultEngineOptions, this.getImageOptions());
    return {};
  }

  /** The WebGL canvas created by getWebGLCanvas() */
  private glCanvas: CoreCanvasWebGL;

  protected ensureNotDisposedAndHasContext(): void {
    // Child objects recursively call their parents. As parent, we must check the WebGL context.
    const gl = this.getWebGLCanvas();
    gl.throwOnContextLost();
  }

  protected releaseOwnResources(flags: FimReleaseResourcesFlags): void {
    const me = this;

    if (((flags & FimReleaseResourcesFlags.WebGL) === FimReleaseResourcesFlags.WebGL) && me.glCanvas) {
      me.resources.recordDispose(me, me.glCanvas);
      me.glCanvas.dispose();
      me.glCanvas = undefined;
    }

    if ((flags & FimReleaseResourcesFlags.All) === FimReleaseResourcesFlags.All) {
      // Check the resource tracker. All totals should be zero, otherwise it indicates a resource leak in the FIM
      // library itself.
      if (me.resources.totals.instances > 0 || me.resources.totals.canvasMemory > 0 ||
          me.resources.totals.glMemory > 0) {
        FimError.throwObject(FimErrorCode.ResourceLeak, me.resources.metrics);
      }
    }
  }

  private onContextLost(): void {
    const me = this;
    me.isContextLostValue = true;
    me.writeWarning(me, 'WebGL context lost');

    // Release all shaders and textures
    me.releaseResources(FimReleaseResourcesFlags.WebGLShader | FimReleaseResourcesFlags.WebGLTexture);
  }

  private onContextRestored(): void {
    const me = this;
    me.isContextLostValue = false;
    me.writeWarning(me, 'WebGL context restored');
  }

  private isContextLostValue = false;

  public isContextLost(): boolean {
    return this.isContextLostValue;
  }

  public registerContextLostHandler(handler: () => void): void {
    const glCanvas = this.getWebGLCanvas();
    glCanvas.registerContextLostHandler(handler);
  }

  public registerContextRestoredHandler(handler: () => void): void {
    const glCanvas = this.getWebGLCanvas();
    glCanvas.registerContextRestoredHandler(handler);
  }

  public getResourceMetrics(): FimResourceMetrics {
    return this.resources.totals;
  }

  public getResourceMetricsDetailed(): FimResourceUsage {
    return this.resources.metrics;
  }

  public createImage(options?: FimImageOptions, dimensions?: FimDimensions, name?: string, parent?: FimObject):
      TEngineImage {
    this.ensureNotDisposed();
    return this.createEngineImage(parent ?? this, options ?? {}, dimensions ?? this.maxImageDimensions, name);
  }

  public createImageFromPngAsync(pngFile: Uint8Array, options?: FimImageOptions, name?: string, parent?: FimObject):
      Promise<TEngineImage> {
    return this.createImageFromFileAsync(pngFile, CoreMimeType.PNG, options, name, parent);
  }

  public createImageFromJpegAsync(jpegFile: Uint8Array, options?: FimImageOptions, name?: string, parent?: FimObject):
      Promise<TEngineImage> {
    return this.createImageFromFileAsync(jpegFile, CoreMimeType.JPEG, options, name, parent);
  }

  /** Internal implementation of `createImageFromPngAsync` and `createImageFromJpegAsync` */
  private async createImageFromFileAsync(file: Uint8Array, type: CoreMimeType, options?: FimImageOptions, name?: string,
      parent?: FimObject): Promise<TEngineImage> {
    const me = this;
    me.ensureNotDisposed();

    let result: TEngineImage;
    await me.imageLoader(file, type, image => {
      result = me.createEngineImage(parent ?? this, options ?? {}, FimDimensions.fromObject(image), name);
      result.loadFromImage(image);
    });

    return result;
  }

  public createGLShader(fragmentShader: GlslShader, vertexShader?: GlslShader, name?: string, parent?: FimObject):
      TEngineShader {
    this.ensureNotDisposed();
    return this.createEngineGLShader(parent ?? this, fragmentShader, vertexShader, name);
  }

  /** Derived classes must implement this method to call the TEngineImage constructor */
  protected abstract createEngineImage(parent: FimObject, options: FimImageOptions, dimensions: FimDimensions,
    name?: string): TEngineImage;

  /** Derived classes must implement this method to call the TEngineShader constructor */
  protected abstract createEngineGLShader(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader,
    name?: string): TEngineShader;

  /** Derived classes must implement this method to call the CoreCanvas2D constructor */
  public abstract createCoreCanvas2D(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string):
    CoreCanvas2D;

  /** Derived classes must implement this method to call the CoreCanvasWebGL constructor */
  public abstract createCoreCanvasWebGL(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string):
    CoreCanvasWebGL;
}
