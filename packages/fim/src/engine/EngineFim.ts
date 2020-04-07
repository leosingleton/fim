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
import { CoreCallbackCollection } from '../core/CoreCallbackCollection';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasOptions } from '../core/CoreCanvasOptions';
import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { CoreFileReader, fileToName } from '../core/CoreFileReader';
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
   * @param fileReaderAsync `CoreFileReader` implementation for reading or downloading binary files
   * @param imageLoaderAsync `CoreImageLoader` implementation for reading and writing to and from PNG and JPEG formats
   * @param name An optional name specified when creating the object to help with debugging
   */
  public constructor(public readonly fileReaderAsync: CoreFileReader, public readonly imageLoaderAsync: CoreImageLoader,
      name?: string) {
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
    const tinyCanvas = this.createCoreCanvasWebGL(FimDimensions.fromSquareDimension(1), {},
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
    engineOptions.maxImageDimensions = FimDimensions.fromSquareDimension(maxDimension);
  }

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

  /**
   * Returns the WebGL canvas for running shaders. Allocates the canvas on first use. Resizes the canvas if it is
   * smaller than desired.
   *
   * _WARNING_: This function may dispose the `glCanvas` property in order to resize an existing WebGL canvas. It should
   * only be called at the entry point to a FIM engine operation and not in the middle where state has already been
   * stored in the WebGL context.
   *
   * @param dimensions Requested canvas dimensions. Note that the returned canvas may be larger than requested if it
   *    is already oversized for previous requests. Also note that the returned canvas may be smaller than requested
   *    if its size is limited by the WebGL capabilities or by the FIM engine options.
   */
  public async allocateWebGLCanvasAsync(dimensions: FimDimensions): Promise<CoreCanvasWebGL> {
    const me = this;

    // If the WebGL canvas is already allocated, check whether it is the desired size. If so, simply return the existing
    // canvas.
    let glCanvas = me.glCanvas;
    if (glCanvas && glCanvas.dim.containsDimensions(dimensions)) {
      return glCanvas;
    }

    // Calculate the desired WebGL canvas size
    dimensions = me.calculateWebGLCanvasDimensions(dimensions);

    if (glCanvas) {
      // Check the dimensions of the current WebGL canvas again. Even though it may be smaller than requested, it may
      // already be as large as possible due to WebGL capabilities or FIM engine options.
      if (glCanvas.dim.containsDimensions(dimensions)) {
        return glCanvas;
      }

      // If we get here, the existing WebGL canvas is too small and needs to be resized. First, backup all WebGL
      // textures to 2D canvases so they do not get lost. Then, dispose all WebGL resources.
      await EngineFimBase.recursiveBackupAsync(me);
      me.releaseResources(FimReleaseResourcesFlags.WebGL);
    }

    // Create a new WebGL canvas
    me.optimizer.reserveCanvasMemory(dimensions.getArea() * 4);
    glCanvas = me.glCanvas = me.createCoreCanvasWebGL(dimensions, me.getGLCanvasOptions(), `${me.handle}/WebGLCanvas`);

    // Register context lost handler and restored handlers. On context lost, we must free all textures and shaders. They
    // get recreated again on first use.
    glCanvas.registerContextLostHandler(() => this.onContextLost());
    glCanvas.registerContextRestoredHandler(() => this.onContextRestored());

    // Record the WebGL canvas creation
    me.resources.recordCreate(me, glCanvas);

    return glCanvas;
  }

  /**
   * Calculates the desired size of the WebGL canvas
   * @param dimensions Requested canvas dimensions. Note that the returned dimensions may be larger than requested if
   *    the WebGL canvas is already oversized for previous requests. Also note that the returned dimensions may be
   *    smaller than requested if its size is limited by the WebGL capabilities or by the FIM engine options.
   * @returns Desired canvas dimensions
   */
  private calculateWebGLCanvasDimensions(dimensions: FimDimensions): FimDimensions {
    const me = this;

    // Ensure the requested WebGL canvas dimensions are sufficent for not only this request, but also previous ones too
    if (me.glCanvas) {
      dimensions = FimDimensions.fromMax(me.glCanvas.dim, dimensions);
    }

    // Mobile and older GPUs may have limits as low as 2048x2048 for render buffers. First, read the device
    // capabilities to ensure we do not exceed the GPU's capabilities
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
    const maxDimensions = FimDimensions.fromSquareDimension(maxDimension);
    const maxImageDimensions = FimDimensions.fromMin(maxDimensions, me.engineOptions.maxImageDimensions);
    return dimensions.fitInside(maxImageDimensions).toFloor();
  }

  /**
   * Recursively calls `backupAsync()` on an object and all of its children
   * @param object Root object
   */
  private static async recursiveBackupAsync(object: EngineObject): Promise<void> {
    if (object instanceof EngineImage) {
      await object.backupAsync();
    }

    // Recurse for all children
    for (const child of object.childObjects) {
       await EngineFimBase.recursiveBackupAsync(child);
    }
  }

  /**
   * Returns the WebGL canvas for running shaders. Throws an exception if one has not already been created by calling
   * `allocateWebGLCanvasAsync()`.
   */
  public getWebGLCanvas(): CoreCanvasWebGL {
    if (!this.glCanvas) {
      // If we get here, there's a bug in the EngineFim implementation. allocateWebGLCanvasAsync() should always be
      // called at any entry point that could lead here.
      FimError.throwOnUnreachableCode();
    }

    return this.glCanvas;
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
    if (this.isContextLostValue) {
      throw new FimError(FimErrorCode.WebGLContextLost);
    }
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

    me.contextLostHandlers.invokeCallbacks();
  }

  private onContextRestored(): void {
    const me = this;
    me.isContextLostValue = false;
    me.writeWarning(me, 'WebGL context restored');

    me.contextRestoredHandlers.invokeCallbacks();
  }

  private isContextLostValue = false;

  public isContextLost(): boolean {
    return this.isContextLostValue;
  }

  public registerContextLostHandler(handler: () => void): void {
    // We keep a level of indirection rather than registering the callbacks directly on the WebGL canvas, because the
    // WebGL canvas may get destroyed and recreated in order to resize it.
    this.contextLostHandlers.registerCallback(handler);
  }

  public registerContextRestoredHandler(handler: () => void): void {
    // We keep a level of indirection rather than registering the callbacks directly on the WebGL canvas, because the
    // WebGL canvas may get destroyed and recreated in order to resize it.
    this.contextRestoredHandlers.registerCallback(handler);
  }

  /** Context lost callbacks */
  private contextLostHandlers = new CoreCallbackCollection();

  /** Context restored callbacks */
  private contextRestoredHandlers = new CoreCallbackCollection();

  public getResourceMetrics(): FimResourceMetrics {
    return this.resources.totals;
  }

  public getResourceMetricsDetailed(): FimResourceUsage {
    return this.resources.metrics;
  }

  public createImage(dimensions: FimDimensions, options?: FimImageOptions, name?: string, parent?: FimObject):
      TEngineImage {
    this.ensureNotDisposed();
    return this.createEngineImage(parent ?? this, dimensions, options ?? {}, name);
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
    await me.imageLoaderAsync(file, type, image => {
      result = me.createEngineImage(parent ?? this, FimDimensions.fromObject(image), options ?? {}, name);
      result.loadFromImage(image);
    });

    return result;
  }

  public async createImageFromPngFileAsync(pngUrlOrPath: string, options?: FimImageOptions, name?: string,
      parent?: FimObject): Promise<TEngineImage> {
    const pngFile = await this.fileReaderAsync(pngUrlOrPath);
    return this.createImageFromPngAsync(pngFile, options, name ?? fileToName(pngUrlOrPath), parent);
  }

  public async createImageFromJpegFileAsync(jpegUrlOrPath: string, options?: FimImageOptions, name?: string,
      parent?: FimObject): Promise<TEngineImage> {
    const jpegFile = await this.fileReaderAsync(jpegUrlOrPath);
    return this.createImageFromJpegAsync(jpegFile, options, name ?? fileToName(jpegUrlOrPath), parent);
  }

  public createGLShader(fragmentShader: GlslShader, vertexShader?: GlslShader, name?: string, parent?: FimObject):
      TEngineShader {
    this.ensureNotDisposed();
    return this.createEngineGLShader(parent ?? this, fragmentShader, vertexShader, name);
  }

  /** Derived classes must implement this method to call the TEngineImage constructor */
  protected abstract createEngineImage(parent: FimObject, dimensions: FimDimensions, options: FimImageOptions,
    name?: string): TEngineImage;

  /** Derived classes must implement this method to call the TEngineShader constructor */
  protected abstract createEngineGLShader(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader,
    name?: string): TEngineShader;

  /** Derived classes must implement this method to call the CoreCanvas2D constructor */
  public abstract createCoreCanvas2D(dimensions: FimDimensions, options: CoreCanvasOptions, handle: string):
    CoreCanvas2D;

  /** Derived classes must implement this method to call the CoreCanvasWebGL constructor */
  public abstract createCoreCanvasWebGL(dimensions: FimDimensions, options: CoreCanvasOptions, handle: string):
    CoreCanvasWebGL;
}
