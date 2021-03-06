// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { CoreShader } from './CoreShader';
import { CoreTexture } from './CoreTexture';
import { CoreTextureOptions } from './CoreTextureOptions';
import { CoreWebGLObject } from './CoreWebGLObject';
import { RenderingContextWebGL } from './types/RenderingContextWebGL';
import { FimWebGLCapabilities } from '../api/FimCapabilities';
import { FimImageOptions } from '../api/FimImageOptions';
import { FimTransform2D } from '../math/FimTransform2D';
import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';
import { FimTextureSampling } from '../primitives/FimTextureSampling';
import { AsyncManualResetEvent, CallbackCollection } from '@leosingleton/commonlibs';
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

    // Disable unneeded features, as we are doing 2D graphics
    const gl = me.getContext();
    gl.disable(gl.BLEND);
    me.throwWebGLErrorsDebug();
    gl.disable(gl.CULL_FACE);
    me.throwWebGLErrorsDebug();
    gl.disable(gl.DEPTH_TEST);
    me.throwWebGLErrors();
  }

  /**
   * Returns the WebGL rendering context for the canvas
   * @param throwOnContextLost By default, a value of `true` causes this function to throw an exception if the WebGL
   *    context is currently lost. It may be explicitly set to `false` for cleanup routines and the like, which want to
   *    get the context object anyway.
   */
  public getContext(throwOnContextLost = true): RenderingContextWebGL {
    const me = this;
    me.ensureNotDisposed();

    if (!me.renderingContext) {
      me.renderingContext = me.createContext();
      if (!me.renderingContext) {
        throw new FimError(FimErrorCode.NoWebGL, `${me.objectHandle}: ${me.contextFailMessage}`);
      }
    }

    if (throwOnContextLost && me.isContextLost) {
      throw new FimError(FimErrorCode.WebGLContextLost, me.objectHandle);
    }

    return me.renderingContext;
  }

  /** Cached rendering context */
  private renderingContext: RenderingContextWebGL;

  /** Derived classes must override this method to call `canvas.getContext('webgl')` */
  public abstract createContext(): RenderingContextWebGL;

  /** Set to `false` whenever the WebGL context is lost */
  public isContextLost = false;

  /** Shader and texture objects that belong to this WebGL canvas */
  public childObjects: CoreWebGLObject[] = [];

  public dispose(): void {
    const me = this;
    me.isDisposing = true;

    // Remove event listeners
    me.removeCanvasEventListener(EventListenerType.ContextLost, this.onContextLost.bind(this), false);
    me.removeCanvasEventListener(EventListenerType.ContextRestored, this.onContextRestored.bind(this), false);
    me.removeCanvasEventListener(EventListenerType.ContextCreationError, this.onContextCreationError.bind(this), false);

    // Dispose all child objects
    for (const child of me.childObjects) {
      child.dispose();
    }
    me.childObjects = [];

    // Remove all callbacks
    me.contextLostHandlers.removeAllCallbacks();
    me.contextRestoredHandlers.removeAllCallbacks();

    // Some WebGL implementations support an extension to force a context loss. This seems to help on Chrome, where unit
    // tests may create hundreds of WebGL contexts before the garbage collector cleans up the unused ones.
    const gl = me.getContext(false);
    const extension = gl.getExtension('WEBGL_lose_context');
    if (extension) {
      extension.loseContext();
    }

    super.dispose();
  }

  /**
   * Set to true at the beginning of the `dispose()` function to prevent race conditions between `dispose()` and
   * `onContextLost()` and `onContextRestored()`
   */
  private isDisposing = false;

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
    this.contextLostHandlers.registerCallback(handler);
  }

  /**
   * Registers a callback to invoke when a WebGL context restored event occurs
   * @param handler Handler to invoke
   */
  public registerContextRestoredHandler(handler: () => void): void {
    this.contextRestoredHandlers.registerCallback(handler);
  }

  /** Handler for the `webglcontextlost` event */
  private onContextLost(event?: Event): void {
    const me = this;

    // The unit test mocks may not pass an Event object. In this case, skip the preventDefaults() call.
    if (event) {
      event.preventDefault();
    }

    // onContextLost() may get called during the implementation of dispose() itself. If so, ignore it.
    if (me.isDisposed || me.isDisposing) {
      return;
    }

    me.isContextLost = true;
    me.hasImage = false;

    me.contextLostHandlers.invokeCallbacks();

    // Dispose all child objects
    for (const child of me.childObjects) {
      child.dispose();
    }
    me.childObjects = [];

    // If we were using any built-in fragment shaders, they got disposed in the step above
    me.shaderCopy = undefined;
    me.shaderFill = undefined;

    // Wake up any calls to loseContextAsync()
    me.contextLostEvent.setEvent();
  }

  /** Handler for the `webglcontextrestored` event */
  private onContextRestored(_event?: Event): void {
    const me = this;

    // There appears to be a race condition where the onContextRestored() handler is getting called on a disposed object
    // even though we remove the listener at the very top of the dispose() function. Silently ignore it if this happens.
    if (me.isDisposed || me.isDisposing) {
      return;
    }

    me.isContextLost = false;

    // I'm not 100% sure, but we probably will have re-enable all WebGL extensions after losing the WebGL context...
    me.loadExtensions();

    me.contextRestoredHandlers.invokeCallbacks();

    // Wake up any calls to restoreContextAsync()
    me.contextRestoredEvent.setEvent();
  }

  /** Handler for the `webglcontextcreationerror` event */
  private onContextCreationError(event: WebGLContextEvent): void {
    this.contextFailMessage = event.statusMessage;
  }

  /** Context lost callbacks */
  private contextLostHandlers = new CallbackCollection();

  /** Context restored callbacks */
  private contextRestoredHandlers = new CallbackCollection();

  /** Returns additional error details in case `getContext('webgl')` fails */
  private contextFailMessage: string;

  /** Forces a WebGL context loss for test purposes */
  public async loseContextAsync(): Promise<void> {
    const me = this;

    // Get the WebGL context. If the WebGL context is already lost, this is a no-op.
    const gl = me.getContext(false);
    if (!gl) {
      return;
    }

    // Get the extension. We save it, as once the context is lost, gl.getExtension() seems to be unreliable.
    const extension = gl.getExtension('WEBGL_lose_context');
    if (extension) {
      me.extensionLoseContext = extension;

      // Simulate a context loss
      extension.loseContext();
    } else {
      // Some implementations like headless-gl do not support the WEBGL_lose_context extension. The second-best way is
      // to fake it by calling the events ourselves.
      me.onContextLost();
    }

    // Wait for the handler to execute
    return me.contextLostEvent.waitAsync();
  }

  /** Forces the WebGL context to be restored for test purposes */
  public restoreContextAsync(): Promise<void> {
    const me = this;

    // Simulate the context being restored
    if (me.extensionLoseContext) {
      me.extensionLoseContext.restoreContext();
      me.extensionLoseContext = undefined;
    } else {
      // Some implementations like headless-gl do not support the WEBGL_lose_context extension. The second-best way is
      // to fake it by calling the events ourselves. The typecast to any allows us to call a private function.
      me.onContextRestored();
    }

    // Wait for the handler to execute
    return me.contextRestoredEvent.waitAsync();
  }

  /**
   * We store the reference to the `WEBGL_lose_context` extension between calls to `loseContextAsync()` and
   * `restoreContextAsync()`. Once the context is lost, gl.getExtension() seems to be unreliable.
   */
  private extensionLoseContext: WEBGL_lose_context;

  /**
   * Event to wake up calls to `loseContextAsync()` after delivering all context lost notifications. The WebGL extension
   * to simulate context loss doesn't execute the handlers before resuming JavaScript execution. This event works around
   * this.
   */
  private contextLostEvent = new AsyncManualResetEvent();

  /**
   * Event to wake up calls to `restoreContextAsync()`. `restoreContextAsync()` doesn't seem to have the same problem as
   * `loseContextAsync()`, but we also wait on the handler for consistency.
   */
  private contextRestoredEvent = new AsyncManualResetEvent();

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
      FimError.throwOnInvalidParameter(`${child.objectHandle} is not child of ${this.objectHandle}`);
    }
  }

  /** Loads WebGL extensions. Called from the constructor and on context restored notifications. */
  private loadExtensions(): void {
    const me = this;
    const gl = me.getContext();

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

    FimError.throwOnUnreachableCodeValue(bpp);
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
      // According the Khronos conformance tests, implementations are validated with 2 fewer uniforms than reported to
      // account for special reserved values. Subtract these automatically. For details, see:
      // https://github.com/KhronosGroup/WebGL/blob/master/sdk/tests/conformance/glsl/misc/
      //   shader-with-too-many-uniforms.html
      glMaxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) - 2,
      glMaxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) - 2,
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

    return new CoreShader(me, handle ?? `${me.objectHandle}/Shader`, fragmentShader, vertexShader);
  }

  /**
   * Calls the CoreTexture constructor
   * @param dimensions Texture dimensions
   * @param options Texture options
   * @param handle Optional texture handle, for debugging
   */
  public createCoreTexture(dimensions: FimDimensions, options: CoreTextureOptions, handle?: string): CoreTexture {
    const me = this;
    me.ensureNotDisposed();

    return me.createCoreTextureInternal(me, dimensions, options, handle ?? `${me.objectHandle}/Texture`);
  }

  /** Derived classes must implement this method to call the `CoreCanvas2D` constructor */
  protected abstract createCoreTextureInternal(parent: CoreCanvasWebGL, dimensions: FimDimensions,
    options: FimImageOptions, handle: string): CoreTexture;

  public fillSolid(color: FimColor | string): void {
    const me = this;
    me.ensureNotDisposed();

    const c = FimColor.fromColorOrString(color);
    const cVec = c.toVector();

    const gl = me.getContext();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    me.throwWebGLErrorsDebug();
    gl.viewport(0, 0, me.dim.w, me.dim.h);
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
    me.ensureNotDisposedAndHasImage();

    const gl = me.getContext();
    const pixel = new Uint8Array(4);

    // Flip Y, as the coordinates for readPixels start in the lower-left corner
    point = FimPoint.fromXY(point.x, me.dim.h - point.y - 1).toFloor();
    point.validateIn(me);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    me.throwWebGLErrorsDebug();
    gl.readPixels(point.x, point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    me.throwWebGLErrors();

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }

  public exportToPixelData(srcCoords?: FimRect): Uint8ClampedArray {
    const me = this;
    me.ensureNotDisposedAndHasImage();

    // Default parameter
    srcCoords = srcCoords ?? FimRect.fromDimensions(me.dim);
    srcCoords.validateIn(me);

    // Flip Y, as the coordinates for readPixels start in the lower-left corner
    srcCoords = FimRect.fromXYWidthHeight(srcCoords.xLeft, me.dim.h - srcCoords.yBottom, srcCoords.dim.w,
      srcCoords.dim.h);

    const gl = me.getContext();
    const data = new Uint8Array(srcCoords.getArea() * 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    me.throwWebGLErrorsDebug();
    gl.readPixels(srcCoords.xLeft, srcCoords.yTop, srcCoords.dim.w, srcCoords.dim.h, gl.RGBA, gl.UNSIGNED_BYTE, data);
    me.throwWebGLErrors();

    // Flip the image on the Y axis
    const row = srcCoords.dim.w * 4;
    const temp = new Uint8Array(row);
    for (let y = 0; y < Math.floor(srcCoords.dim.h / 2); y++) {
      const offset1 = y * row;
      const offset2 = (srcCoords.dim.h - y - 1) * row;
      temp.set(data.subarray(offset1, offset1 + row));
      data.set(data.subarray(offset2, offset2 + row), offset1);
      data.set(temp, offset2);
    }

    return new Uint8ClampedArray(data);
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
    srcTexture.ensureNotDisposedAndHasImage();

    // Default parameters
    srcCoords = (srcCoords ?? FimRect.fromDimensions(srcTexture.dim)).toFloor();
    destCoords = (destCoords ?? FimRect.fromDimensions(me.dim)).toFloor();

    srcCoords.validateIn(srcTexture);
    destCoords.validateIn(me);

    // Calculate the transformation matrix to achieve the requested srcCoords
    const matrix = FimTransform2D.fromSrcCoords(srcCoords, srcTexture.dim);

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
      me.shaderCopy = me.createCoreShader(shader, undefined, `${me.objectHandle}/CopyShader`);
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
      me.shaderFill = me.createCoreShader(shader, undefined, `${me.objectHandle}/FillShader`);
    }

    return me.shaderFill;
  }

  private shaderFill: CoreShader;
}

/** Type parameter values for `HTMLCanvasElement.addEventListener()` */
export const enum EventListenerType {
  ContextLost = 'webglcontextlost',
  ContextRestored = 'webglcontextrestored',
  ContextCreationError = 'webglcontextcreationerror'
}
