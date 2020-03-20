// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { EngineShader } from './EngineShader';
import { FimBase } from '../api/Fim';
import { FimCapabilities } from '../api/FimCapabilities';
import { FimEngineOptions, defaultEngineOptions } from '../api/FimEngineOptions';
import { FimImageOptions, defaultImageOptions } from '../api/FimImageOptions';
import { FimObject } from '../api/FimObject';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { FimDimensions } from '../primitives/FimDimensions';
import { deepCopy } from '@leosingleton/commonlibs';
import { GlslShader } from 'webpack-glsl-minify';

/** Client implementation of the Fim interface */
export abstract class EngineFim<TEngineImage extends EngineImage, TEngineShader extends EngineShader>
    extends EngineObject implements FimBase<TEngineImage, TEngineShader> {
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
  }

  public readonly maxImageDimensions: FimDimensions;
  public readonly engineOptions: FimEngineOptions;
  public readonly defaultImageOptions: FimImageOptions;
  public readonly capabilities: FimCapabilities;

  // Force parentObject to be a more specific type
  public parentObject: never;

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
    const glDimensions = me.maxImageDimensions.downscaleToMaxDimension(maxDimension);
    const glCanvas = me.glCanvas = me.createCoreCanvasWebGL({}, glDimensions, `${me.handle}/WebGLCanvas`);

    // Register context lost handler and restored handlers. On context lost, we must free all textures and shaders. They
    // get recreated again on first use.
    glCanvas.registerContextLostHandler(() => this.onContextLost());
    glCanvas.registerContextRestoredHandler(() => this.onContextRestored());

    return glCanvas;
  }

  /** The WebGL canvas created by getWebGLCanvas() */
  private glCanvas: CoreCanvasWebGL;

  protected ensureNotDisposedAndHasContext(): void {
    // Child objects recursively call their parents. As parent, we must check the WebGL context.
    const gl = this.getWebGLCanvas();
    gl.throwOnContextLost();
  }

  protected releaseOwnResources(flags: FimReleaseResourcesFlags): void {
    if (((flags & FimReleaseResourcesFlags.WebGL) === FimReleaseResourcesFlags.WebGL) && this.glCanvas) {
      this.glCanvas.dispose();
      this.glCanvas = undefined;
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

  public registerChildObject(child: FimObject): void {
    this.addChild(child);
  }

  public unregisterChildObject(child: FimObject): void {
    this.removeChild(child);
  }

  public createImage(options?: FimImageOptions, dimensions?: FimDimensions, imageName?: string): TEngineImage {
    this.ensureNotDisposed();
    return this.createEngineImage(options ?? {}, dimensions ?? this.maxImageDimensions, imageName);
  }

  public createImageFromPngAsync(pngFile: Uint8Array, options?: FimImageOptions, imageName?: string):
      Promise<TEngineImage> {
    this.ensureNotDisposed();
    return this.createEngineImageFromPngAsync(pngFile, options ?? {}, imageName);
  }

  public createImageFromJpegAsync(jpegFile: Uint8Array, options?: FimImageOptions, imageName?: string):
      Promise<TEngineImage> {
    this.ensureNotDisposed();
    return this.createEngineImageFromJpegAsync(jpegFile, options ?? {}, imageName);
  }

  /** Derived classes must implement this method to call the TEngineImage constructor */
  protected abstract createEngineImage(options: FimImageOptions, dimensions: FimDimensions, imageName?: string):
    TEngineImage;

  /** Derived classes must implement this method to create a TEngineImage from a PNG file */
  protected abstract createEngineImageFromPngAsync(pngFile: Uint8Array, options: FimImageOptions, imageName?: string):
    Promise<TEngineImage>;

  /** Derived classes must implement this method to create a TEngineImage from a JPEG file */
  protected abstract createEngineImageFromJpegAsync(jpegFile: Uint8Array, options: FimImageOptions, imageName?: string):
    Promise<TEngineImage>;

  /** Derived classes must implement this method to call the TEngineShader constructor */
  public abstract createGLShader(fragmentShader: GlslShader, vertexShader?: GlslShader, shaderName?: string):
    TEngineShader;

  /** Derived classes must implement this method to call the CoreCanvas2D constructor */
  public abstract createCoreCanvas2D(options: FimImageOptions, dimensions: FimDimensions, handle: string): CoreCanvas2D;

  /** Derived classes must implement this method to call the CoreCanvasWebGL constructor */
  public abstract createCoreCanvasWebGL(options: FimImageOptions, dimensions: FimDimensions, handle: string):
    CoreCanvasWebGL;
}
