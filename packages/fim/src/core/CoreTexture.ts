// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { CoreCanvasWebGL } from './CoreCanvasWebGL';
import { CoreTextureOptions } from './CoreTextureOptions';
import { CoreWebGLObject } from './CoreWebGLObject';
import { FimTransform2D } from '../math/FimTransform2D';
import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimColor } from '../primitives/FimColor';
import { FimDimensional } from '../primitives/FimDimensional';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';
import { FimTextureSampling } from '../primitives/FimTextureSampling';
import { deepCopy, usingAsync } from '@leosingleton/commonlibs';

/** Wrapper around WebGL textures */
export abstract class CoreTexture extends CoreWebGLObject implements FimDimensional {
  /**
   * Constructor
   * @param parent The parent WebGL canvas
   * @param dimensions Texture dimensions
   * @param options Texture options
   * @param handle Texture handle, for debugging
   */
  public constructor(parent: CoreCanvasWebGL, dimensions: FimDimensions, options: CoreTextureOptions, handle: string) {
    super(parent, handle);
    this.dim = dimensions.toFloor();
    this.textureOptions = deepCopy(options);

    // Ensure the dimensions do not exceed WebGL's maximum texture size
    const caps = parent.detectCapabilities();
    const maxTextureSize = FimDimensions.fromSquareDimension(caps.glMaxTextureSize);
    if (dimensions.w > maxTextureSize.w || dimensions.h > maxTextureSize.h) {
      FimError.throwOnInvalidDimensions(maxTextureSize, dimensions);
    }

    // Ensure the dimensions do not exceed WebGL's max output buffer size
    if (!options.isReadOnly) {
      const maxRenderBufferSize = FimDimensions.fromSquareDimension(caps.glMaxRenderBufferSize);
      if (dimensions.w > maxRenderBufferSize.w || dimensions.h > maxRenderBufferSize.h) {
        FimError.throwOnInvalidDimensions(maxRenderBufferSize, dimensions);
      }
    }

    // Ensure the requested BPP does not exceed WebGL's maximum
    const bpp = options.bpp;
    const bppCaps = parent.getSupportedColorDepths(options.sampling);
    if (bppCaps.indexOf(bpp) === -1) {
      FimError.throwOnInvalidParameter(`BPP${bpp} !${bppCaps}`);
    }

    // glReadOnly textures are limited to 8 BPP, as FIM doesn't have any input formats that support higher to load the
    // texture contents from.
    if (options.isReadOnly && bpp > FimBitsPerPixel.BPP8) {
      FimError.throwOnInvalidParameter(`BPP${bpp} (RO)`);
    }

    // Create a texture
    const gl = parent.getContext();
    const texture = gl.createTexture();
    parent.throwWebGLErrorsDebug();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    parent.throwWebGLErrorsDebug();

    try {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      parent.throwWebGLErrorsDebug();
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      parent.throwWebGLErrorsDebug();

      const filter = (options.sampling === FimTextureSampling.Linear) ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      parent.throwWebGLErrorsDebug();
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      parent.throwWebGLErrorsDebug();

      this.texture = texture;
    } finally {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  protected disposeSelf(): void {
    const me = this;
    const gl = me.parentCanvas.getContext(false);

    // Report telemetry for debugging
    // recordDispose(this, FimObjectType.GLTexture);

    me.hasImage = false;

    if (me.texture) {
      gl.deleteTexture(me.texture);
      me.texture = undefined;
    }

    if (me.fb) {
      gl.deleteFramebuffer(me.fb);
      me.fb = undefined;
    }
  }

  /** Texture options */
  public readonly textureOptions: CoreTextureOptions;

  /** Texture dimensions */
  public readonly dim: FimDimensions;

  public bind(textureUnit: number): void {
    this.bindInternal(textureUnit, this.texture);
  }

  public unbind(textureUnit: number): void {
    this.bindInternal(textureUnit, null);
  }

  private bindInternal(textureUnit: number, texture: WebGLTexture): void {
    const parent = this.parentCanvas;
    const gl = parent.getContext();

    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    parent.throwWebGLErrorsDebug();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    parent.throwWebGLErrorsDebug();
  }

  /**
   * Fills the texture with a solid color
   * @param color Fill color
   */
  public fillSolid(color: FimColor | string): void {
    const me = this;
    me.ensureNotDisposed();
    const c = FimColor.fromColorOrString(color);
    const parent = me.parentCanvas;
    const gl = parent.getContext();
    const destinationFramebuffer = me.getFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, destinationFramebuffer);
    parent.throwWebGLErrorsDebug();
    gl.viewport(0, 0, me.dim.w, me.dim.h);
    parent.throwWebGLErrorsDebug();
    gl.disable(gl.SCISSOR_TEST);
    parent.throwWebGLErrorsDebug();
    gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
    parent.throwWebGLErrorsDebug();
    gl.clear(gl.COLOR_BUFFER_BIT);
    parent.throwWebGLErrorsDebug();

    me.hasImage = true;
  }

  /**
   * Loads the texture contents from RGBA data
   * @param pixelData An array containing 4 bytes per pixel, in RGBA order
   */
  public loadPixelData(pixelData: Uint8ClampedArray): void {
    const me = this;
    me.ensureNotDisposed();
    const parent = me.parentCanvas;
    const gl = parent.getContext();

    // Validate the array size matches the expected dimensions
    const expectedLength = me.dim.getArea() * 4;
    if (pixelData.length !== expectedLength) {
      FimError.throwOnInvalidDimensions(me.dim, pixelData.length);
    }

    me.bind(0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    parent.throwWebGLErrorsDebug();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, me.dim.w, me.dim.h, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array(pixelData));
    parent.throwWebGLErrorsDebug();
    me.unbind(0);

    me.hasImage = true;
  }

  /**
   * Copies contents from another texture. Supports neither cropping nor rescaling.
   * @param srcTexture Source texture
   * @param srcCoords Coordinates of source texture to copy from
   * @param destCoords Coordinates of destination texture to copy to
   */
  public copyFromTexture(srcTexture: CoreTexture, srcCoords?: FimRect, destCoords?: FimRect): void {
    const me = this;
    me.ensureNotDisposed();

    // Default parameters
    srcCoords = (srcCoords ?? FimRect.fromDimensions(srcTexture.dim)).toFloor();
    destCoords = (destCoords ?? FimRect.fromDimensions(me.dim)).toFloor();

    srcCoords.validateIn(srcTexture);
    destCoords.validateIn(me);

    // Calculate the transformation matrix to achieve the requested srcCoords
    const matrix = FimTransform2D.fromSrcCoords(srcCoords, srcTexture.dim);

    const copyShader = me.parentCanvas.getCopyShader();
    copyShader.setUniforms({
      uInput: srcTexture
    });
    copyShader.applyVertexMatrix(matrix);
    copyShader.execute(me, destCoords);

    me.hasImage = true;
  }

  /**
   * Copies contents from a canvas. Supports neither cropping nor rescaling.
   * @param srcCanvas Source canvas
   */
  public async copyFromAsync(srcCanvas: CoreCanvas): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // WebGL's texImage2D() will normally rescale an input image to the texture dimensions. However, if the input image
    // is greater than the maximum texture size, it returns an InvalidValue error. To avoid this, we'll explicitly
    // downscale larger images for WebGL.
    const maxDimension = me.parentCanvas.detectCapabilities().glMaxTextureSize;
    if (srcCanvas.dim.w > maxDimension || srcCanvas.dim.h > maxDimension) {
      // Slow path: first copy the source canvas to a smaller canvas
      await usingAsync(srcCanvas.createTemporaryCanvas2D(me.dim, { downscale: 1 }), async temp => {
        await temp.copyFromAsync(srcCanvas);
        await me.copyFromAsync(temp);
      });
    } else {
      // Fast path: implementation is below
      await me.copyFromInternalAsync(srcCanvas);
      me.hasImage = true;
    }
  }

  /**
   * Internal implementation of `copyFrom()`. Derived classes must implement this function.
   *
   * When this is called, we can be ensured that this object is not disposed and that the dimensions of `srcCanvas`
   * match this texture's dimensions.
   *
   * @param srcCanvas Source canvas, of the same dimensions as this texture
   */
  protected abstract copyFromInternalAsync(srcCanvas: CoreCanvas): Promise<void>;

  /** Returns the underlying WebGL framebuffer backing this texture. Allocates the framebuffer on first use. */
  public getFramebuffer(): WebGLFramebuffer {
    const me = this;
    me.ensureNotDisposed();
    if (me.textureOptions.isReadOnly) {
      // Cannot write to an input only texture
      FimError.throwOnImageReadOnly(me.objectHandle);
    }

    if (!me.fb) {
      // The is the first use. Allocate the framebuffer.
      const parent = me.parentCanvas;
      const gl = parent.getContext();
      const texture = me.texture;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      parent.throwWebGLErrorsDebug();

      try {
        // Allocate the texture
        const format = gl.RGBA;
        const depth = parent.getTextureDepthConstant(me.textureOptions.bpp);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, me.dim.w, me.dim.h, 0, format, depth, null);
        parent.throwWebGLErrorsDebug();

        // Create the framebuffer
        this.fb = gl.createFramebuffer();
        parent.throwWebGLErrorsDebug();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        parent.throwWebGLErrorsDebug();
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        parent.throwWebGLErrorsDebug();

        // Check the framebuffer status
        parent.throwOnIncompleteFrameBufferStatus(gl.FRAMEBUFFER, JSON.stringify(me.textureOptions));
      } finally {
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
    }

    return me.fb;
  }

  /**
   * Boolean indicating whether this texture has an image. Set to true by any of the copyFrom() calls, or by using this
   * texture as the output of a `CoreShader.execute()` call.
   */
  public hasImage = false;

  /** Throws an exception if the canvas is disposed or does not have an image */
  public ensureNotDisposedAndHasImage(): void {
    this.ensureNotDisposed();
    if (!this.hasImage) {
      throw new FimError(FimErrorCode.ImageUninitialized, this.objectHandle);
    }
  }

  private texture: WebGLTexture;
  private fb: WebGLFramebuffer;
}
