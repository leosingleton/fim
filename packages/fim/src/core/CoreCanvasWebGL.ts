// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { CoreShader } from './CoreShader';
import { CoreTexture } from './CoreTexture';
import { CoreWebGLObject } from './CoreWebGLObject';
import { RenderingContextWebGL } from './types/RenderingContextWebGL';
import { FimWebGLCapabilities } from '../api/FimCapabilities';
import { FimImageOptions, mergeImageOptions } from '../api/FimImageOptions';
import { FimTextureSampling } from '../api/FimTextureSampling';
import { FimTransform2D } from '../math/FimTransform2D';
import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';
import { UnhandledError } from '@leosingleton/commonlibs';
import { GlslShader } from 'webpack-glsl-minify';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvasWebGL extends CoreCanvas {
  /**
   * Derived classes must call this function at the end of their constructor once they have initialized the object to
   * the point where `getContext()` can be called.
   */
  protected finishInitialization(): void {
    const me = this;

    // Register event listeners
    me.addCanvasEventListener(EventListenerType.ContextLost, this.onContextLost.bind(this), false);
    me.addCanvasEventListener(EventListenerType.ContextRestored, this.onContextRestored.bind(this), false);
    me.addCanvasEventListener(EventListenerType.ContextCreationError, this.onContextCreationError.bind(this), false);

    // Load WebGL extensions
    me.loadExtensions();

    const gl = me.getContext();
    if (!gl) {
      me.throwNoWebGLError();
    }

    // Disable unneeded features, as we are doing 2D graphics
    gl.disable(gl.BLEND);
    me.throwWebGLErrorsDebug();
    gl.disable(gl.CULL_FACE);
    me.throwWebGLErrorsDebug();
    gl.disable(gl.DEPTH_TEST);
    me.throwWebGLErrors();
  }

  /** Derived classes must override this method to call `canvas.getContext('webgl')` */
  public abstract getContext(): RenderingContextWebGL;

  /** Shader and texture objects that belong to this WebGL canvas */
  public childObjects: CoreWebGLObject[] = [];

  public dispose(): void {
    const me = this;

    // Dispose all child objects
    for (const child of me.childObjects) {
      child.dispose();
    }
    me.childObjects = [];

    // Remove all callbacks
    me.contextLostHandlers = [];
    me.contextRestoredHandlers = [];

    // Remove event listeners
    me.removeCanvasEventListener(EventListenerType.ContextLost, this.onContextLost.bind(this), false);
    me.removeCanvasEventListener(EventListenerType.ContextRestored, this.onContextRestored.bind(this), false);
    me.removeCanvasEventListener(EventListenerType.ContextCreationError, this.onContextCreationError.bind(this), false);

    super.dispose();
  }

  /** Derived classes must implement this method to call `canvas.addEventListener()` */
  protected abstract addCanvasEventListener(type: EventListenerType, listener: EventListenerObject,
    options: boolean): void;

  /** Derived classes must implement this method to call `canvas.removeEventListener()` */
  protected abstract removeCanvasEventListener(type: EventListenerType, listener: EventListenerObject,
    options: boolean): void;

  /**
   * Registers a callback to invoke when a WebGL context lost event occurs
   * @param handler Handler to invoke
   */
  public registerContextLostHandler(handler: () => void): void {
    this.contextLostHandlers.push(handler);
  }

  /**
   * Registers a callback to invoke when a WebGL context restored event occurs
   * @param handler Handler to invoke
   */
  public registerContextRestoredHandler(handler: () => void): void {
    this.contextRestoredHandlers.push(handler);
  }

  /** Handler for the `webglcontextlost` event */
  private onContextLost(): void {
    console.log('Lost WebGL context');
    event.preventDefault();

    for (const handler of this.contextLostHandlers) {
      try {
        handler();
      } catch (err) {
        UnhandledError.reportError(err);
      }
    }

    // Free the built-in fragment shaders
    if (this.shaderCopy) {
      this.shaderCopy.dispose();
      this.shaderCopy = undefined;
    }
    if (this.shaderFill) {
      this.shaderFill.dispose();
      this.shaderFill = undefined;
    }
  }

  /** Handler for the `webglcontextrestored` event */
  private onContextRestored(): void {
    console.log('WebGL context restored');

    // I'm not 100% sure, but we probably will have re-enable all WebGL extensions after losing the WebGL context...
    this.loadExtensions();

    for (const handler of this.contextRestoredHandlers) {
      try {
        handler();
      } catch (err) {
        UnhandledError.reportError(err);
      }
    }
  }

  /** Handler for the `webglcontextcreationerror` event */
  private onContextCreationError(event: WebGLContextEvent): void {
    this.contextFailMessage = event.statusMessage;
  }

  /** Context lost callbacks */
  private contextLostHandlers: (() => void)[] = [];

  /** Context restored callbacks */
  private contextRestoredHandlers: (() => void)[] = [];

  /** Returns additional error details in case `getContext('webgl')` fails */
  private contextFailMessage: string;

  /** Throws an error if the browser does not support WebGL */
  private throwNoWebGLError(): never {
    throw new FimError(FimErrorCode.NoWebGL, this.contextFailMessage);
  }

  /** Checks for any WebGL errors and throws a FimError if there are any */
  public throwWebGLErrors(): void {
    const gl = this.getContext();
    const errors: FimError[] = [];
    let done = false;
    do {
      const errorCode = gl.getError();
      if (errorCode === gl.NO_ERROR) {
        done = true;
      } else {
        const fimCode = CoreCanvasWebGL.convertWebGLErrorToFimCode(gl, errorCode);
        const fimMessage = `WebGL ${errorCode}`;
        errors.push(new FimError(fimCode, fimMessage));
      }
    } while (!done);

    FimError.throwCollection(errors);
  }

  /** If we are in debugging mode, checks for any WebGL errors and throws a FimError if there are any */
  public throwWebGLErrorsDebug(): void {
    if (this.engineOptions.debugMode) {
      this.throwWebGLErrors();
    }
  }

  /**
   * Converts a WebGL error code to a FIM error code
   * @param gl WebGL context
   * @param errorCode WebGL error code
   * @returns FIM error code
   */
  private static convertWebGLErrorToFimCode(gl: RenderingContextWebGL, errorCode: number): FimErrorCode {
    switch (errorCode) {
      case gl.INVALID_ENUM:
        return FimErrorCode.WebGLInvalidEnum;

      case gl.INVALID_VALUE:
        return FimErrorCode.WebGLInvalidValue;

      case gl.INVALID_OPERATION:
        return FimErrorCode.WebGLInvalidOperation;

      case gl.INVALID_FRAMEBUFFER_OPERATION:
        return FimErrorCode.WebGLInvalidFrameBufferOperation;

      case gl.OUT_OF_MEMORY:
        return FimErrorCode.WebGLOutOfMemory;

      case gl.CONTEXT_LOST_WEBGL:
        return FimErrorCode.WebGLContextLost;

      default:
        return FimErrorCode.WebGLUnknownError;
    }
  }

  /**
   * Validates the result of `gl.checkFramebufferStatus()` and throws an error on a non-complete value
   * @param target Target of the `gl.checkFramebufferStatus()` call
   * @param message Optional message for debugging
   */
  public throwOnIncompleteFrameBufferStatus(target: number, message?: string): void {
    const gl = this.getContext();
    const status = gl.checkFramebufferStatus(target);
    switch (status) {
      case gl.FRAMEBUFFER_COMPLETE:
        return;

      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusIncompleteAttachment, message);

      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusIncompleteMissingAttachment, message);

      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusIncompleteDimensions, message);

      case gl.FRAMEBUFFER_UNSUPPORTED:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusUnsupported, message);

      default:
        throw new FimError(FimErrorCode.WebGLFramebufferStatusUnknown, `FramebufferStatus ${status} ${message}`);
    }
  }

  /** Throws an exception if the WebGL context is lost */
  public throwOnContextLost(): void {
    const gl = this.getContext();
    if (gl.isContextLost()) {
      throw new FimError(FimErrorCode.WebGLContextLost);
    }
  }

  /**
   * Throws an exception if the object is not a child of this WebGL canvas
   * @param child Child object
   */
  public throwOnNotChild(child: CoreWebGLObject): void {
    if (child.parentCanvas !== this) {
      FimError.throwOnInvalidParameter(`${child.handle} is not child of ${this.imageHandle}`);
    }
  }

  /** Loads WebGL extensions. Called from the constructor and on context restored notifications. */
  private loadExtensions(): void {
    const me = this;
    const gl = me.getContext();
    if (!gl) {
      me.throwNoWebGLError();
    }

    me.extensionTexture32 = gl.getExtension('OES_texture_float');
    me.extensionTextureLinear32 = gl.getExtension('OES_texture_float_linear');
    me.extensionColorBuffer32 = gl.getExtension('WEBGL_color_buffer_float');
    me.extensionTexture16 = gl.getExtension('OES_texture_half_float');
    me.extensionTextureLinear16 = gl.getExtension('OES_texture_half_float_linear');
    me.extensionColorBuffer16 = gl.getExtension('EXT_color_buffer_half_float');
    me.throwWebGLErrorsDebug();
  }

  private extensionTexture32: OES_texture_float;
  private extensionTextureLinear32: OES_texture_float_linear;
  private extensionColorBuffer32: WEBGL_color_buffer_float;
  private extensionTexture16: OES_texture_half_float;
  private extensionTextureLinear16: OES_texture_half_float_linear;
  private extensionColorBuffer16: any;

  /**
   * Calculates the supported color depth for a CoreTexture
   * @param sampling Type of texture sampling to compute the maximum for. Some GPUs have different limits for linear
   *    versus nearest sampling.
   */
  public getSupportedColorDepths(sampling: FimTextureSampling): FimBitsPerPixel[] {
    const result = [FimBitsPerPixel.BPP8];
    const linear = (sampling === FimTextureSampling.Linear);

    const ext = this.extensionTexture16;
    if (ext && this.extensionColorBuffer16) {
      if (!linear || this.extensionTextureLinear16) {
        result.push(FimBitsPerPixel.BPP16);
      }
    }

    if (this.extensionTexture32 && this.extensionColorBuffer32) {
      if (!linear || this.extensionTextureLinear32) {
        result.push(FimBitsPerPixel.BPP32);
      }
    }

    return result;
  }

  /** Calculates the default color depth for a CoreTexture */
  public getDefaultColorDepth(): FimBitsPerPixel {
    const linearCaps = this.getSupportedColorDepths(FimTextureSampling.Linear);
    const nearestCaps = this.getSupportedColorDepths(FimTextureSampling.Nearest);
    if (linearCaps.indexOf(FimBitsPerPixel.BPP16) !== -1 && nearestCaps.indexOf(FimBitsPerPixel.BPP16)) {
      return FimBitsPerPixel.BPP16;
    } else {
      return FimBitsPerPixel.BPP8;
    }
  }

  /**
   * Converts a `FimBitsPerPixel` value to the WebGL constant
   * @param bpp `FimBitsPerPixel`
   * @return Constant used by WebGL function calls
   */
  public getTextureDepthConstant(bpp: FimBitsPerPixel): number {
    const me = this;
    const gl = me.getContext();

    switch (bpp) {
      case FimBitsPerPixel.BPP8:
        return gl.UNSIGNED_BYTE;

      case FimBitsPerPixel.BPP16:
        return me.extensionTexture16.HALF_FLOAT_OES;

      case FimBitsPerPixel.BPP32:
        return gl.FLOAT;
    }

    FimError.throwOnUnreachableCode(bpp);
  }

  /**
   * Detects the browser and GPU capabilities. It is best to create a small CoreCanvasWebGL instance solely for calling
   * this method in order to avoid exceeding the GPU's maximum render buffer dimensions.
   */
  public detectCapabilities(): FimWebGLCapabilities {
    const me = this;
    me.ensureNotDisposed();

    if (me.cachedCapabilities) {
      return me.cachedCapabilities;
    }

    const gl = me.getContext();
    const dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');

    me.cachedCapabilities = {
      glVersion: gl.getParameter(gl.VERSION),
      glShadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      glVendor: gl.getParameter(gl.VENDOR),
      glRenderer: gl.getParameter(gl.RENDERER),
      glUnmaskedVendor: dbgRenderInfo ? gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) : '',
      glUnmaskedRenderer: dbgRenderInfo ? gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL) : '',
      glMaxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      glMaxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      glMaxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      glExtensions: gl.getSupportedExtensions().sort(),
      glTextureDepthsLinear: me.getSupportedColorDepths(FimTextureSampling.Linear),
      glTextureDepthsNearest: me.getSupportedColorDepths(FimTextureSampling.Nearest)
    };
    return me.cachedCapabilities;
  }

  /** Cache the result of `detectCapabilities()` to speed up later calls */
  private cachedCapabilities: FimWebGLCapabilities;

  /**
   * Calls the CoreShader constructor
   * @param fragmentShader Fragment shader, created using webpack-glsl-minify
   * @param vertexShader Optional vertex shader, created using webpack-glsl-minify
   * @param handle Optional shader handle, for debugging
   */
  public createCoreShader(fragmentShader: GlslShader, vertexShader?: GlslShader, handle?: string): CoreShader {
    const me = this;
    me.ensureNotDisposed();

    return new CoreShader(me, handle ?? `${me.imageHandle}/Shader`, fragmentShader, vertexShader);
  }

  /**
   * Calls the CoreTexture constructor
   * @param dimensions Optional texture dimensions. Defaults to the size of this canvas.
   * @param options Optional image options. Values that are unspecified are inherited from this canvas's image options.
   * @param handle Optional texture handle, for debugging
   */
  public createCoreTexture(dimensions?: FimDimensions, options?: FimImageOptions, handle?: string): CoreTexture {
    const me = this;
    me.ensureNotDisposed();

    // If options are not specified, limit the BPP to match the WebGL capabilities
    if (!options) {
      options = { bpp: me.getDefaultColorDepth() };
    } else if (!options.bpp) {
      options.bpp = me.getDefaultColorDepth();
    }

    return me.createCoreTextureInternal(me, handle ?? `${me.imageHandle}/Texture`, dimensions ?? me.canvasDimensions,
      mergeImageOptions(me.imageOptions, options));
  }

  /** Derived classes must implement this method to call the `CoreCanvas2D` constructor */
  protected abstract createCoreTextureInternal(parent: CoreCanvasWebGL, handle: string, dimensions: FimDimensions,
    options: FimImageOptions): CoreTexture;

  public fillSolid(color: FimColor | string): void {
    const me = this;
    me.ensureNotDisposed();

    const gl = me.getContext();
    const c = (color instanceof FimColor) ? color : FimColor.fromString(color);
    const cVec = c.toVector();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    me.throwWebGLErrorsDebug();
    gl.viewport(0, 0, this.canvasDimensions.w, this.canvasDimensions.h);
    me.throwWebGLErrorsDebug();
    gl.disable(gl.SCISSOR_TEST);
    me.throwWebGLErrorsDebug();
    gl.clearColor(cVec[0], cVec[1], cVec[2], cVec[3]);
    me.throwWebGLErrorsDebug();
    gl.clear(gl.COLOR_BUFFER_BIT);
    me.throwWebGLErrorsDebug();

    me.hasImage = true;
  }

  public getPixel(point: FimPoint): FimColor {
    const me = this;
    me.ensureNotDisposed();
    me.ensureHasImage();

    const gl = me.getContext();
    const pixel = new Uint8Array(4);

    // Flip Y, as the coordinates for readPixels start in the lower-left corner
    point = FimPoint.fromXY(point.x, this.canvasDimensions.h - point.y - 1).toFloor();
    this.validateCoordinates(point);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    me.throwWebGLErrorsDebug();
    gl.readPixels(point.x, point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    me.throwWebGLErrors();

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }

  /**
   * Copies contents from a CoreTexture. Supports both cropping and rescaling.
   * @param srcTexture Source texture
   * @param srcCoords Coordinates of source canvas to copy from
   * @param destCoords Coordinates of destination canvas to copy to
   */
  public copyFrom(srcTexture: CoreTexture, srcCoords?: FimRect, destCoords?: FimRect): void {
    const me = this;
    me.ensureNotDisposed();

    // Default parameters
    srcCoords = (srcCoords ?? FimRect.fromDimensions(srcTexture.textureDimensions)).toFloor();
    destCoords = (destCoords ?? FimRect.fromDimensions(me.canvasDimensions)).toFloor();

    srcTexture.validateRect(srcCoords);
    me.validateRect(destCoords);

    // Calculate the transformation matrix to achieve the requested srcCoords
    const matrix = FimTransform2D.fromSrcCoords(srcCoords, srcTexture.textureDimensions);

    const copyShader = me.getCopyShader();
    copyShader.setUniforms({
      uInput: srcTexture
    });
    copyShader.applyVertexMatrix(matrix);
    copyShader.execute(undefined, destCoords);

    me.hasImage = true;
  }

  /**
   * Returns the built-in copy shader. Each WebGL canvas has an instance of this fragment shader, which is automatically
   * created on first use and disposed.
   */
  public getCopyShader(): CoreShader {
    const me = this;
    me.ensureNotDisposed();

    if (!me.shaderCopy) {
      const shader = require('../../build/core/glsl/copy.glsl.js');
      me.shaderCopy = me.createCoreShader(shader, undefined,`${me.imageHandle}/CopyShader`);
    }

    return me.shaderCopy;
  }

  private shaderCopy: CoreShader;

  /**
   * Returns the built-in fill shader. Each WebGL canvas has an instance of this fragment shader, which is automatically
   * created on first use and disposed.
   */
  public getFillShader(): CoreShader {
    const me = this;
    me.ensureNotDisposed();

    if (!me.shaderFill) {
      const shader = require('../../build/core/glsl/fill.glsl.js');
      me.shaderFill = me.createCoreShader(shader, undefined, `${me.imageHandle}/FillShader`);
    }

    return me.shaderFill;
  }

  private shaderFill: CoreShader;
}

/** Type parameter values for `HTMLCanvasElement.addEventListener()` */
const enum EventListenerType {
  ContextLost = 'webglcontextlost',
  ContextRestored = 'webglcontextrestored',
  ContextCreationError = 'webglcontextcreationerror'
}
