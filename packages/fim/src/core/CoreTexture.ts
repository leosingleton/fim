// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { CoreCanvasWebGL } from './CoreCanvasWebGL';
import { CoreWebGLObject } from './CoreWebGLObject';
import { FimImageOptions } from '../api/FimImageOptions';
import { FimTextureSampling } from '../api/FimTextureSampling';
import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimColor } from '../primitives/FimColor';
import { FimColorChannels } from '../primitives/FimColorChannels';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';
import { using } from '@leosingleton/commonlibs';

/** Wrapper around WebGL textures */
export class CoreTexture extends CoreWebGLObject {
  /**
   * Constructor
   * @param parent The parent WebGL canvas
   * @param handle Texture handle, for debugging
   * @param dimensions Texture dimensions
   * @param options Texture options. Must be fully computed with default values populated.
   */
  public constructor(parent: CoreCanvasWebGL, handle: string, dimensions: FimDimensions, options: FimImageOptions) {
    super(parent, handle);
    this.textureDimensions = dimensions.toFloor();
    this.imageOptions = options;
    this.hasImage = false;

    // Ensure the requested BPP does not exceed WebGL's maximum
    const bpp = options.bpp;
    const maxBPP = parent.getMaxTextureDepth(options.sampling);
    if (bpp > maxBPP) {
      FimError.throwOnInvalidParameter(`BPP${bpp} (>${maxBPP})`);
    }

    // glReadOnly textures are limited to 8 BPP, as FIM doesn't have any input formats that support higher to load the
    // texture contents from.
    if (options.glReadOnly && bpp > FimBitsPerPixel.BPP8) {
      FimError.throwOnInvalidParameter(`BPP${bpp} (RO)`);
    }

    // Most GPUs do not support rendering to a greyscale texture. There doesn't seem to be a capability to detect it,
    // so just deny it altogether.
    if (!options.glReadOnly && options.channels === FimColorChannels.Greyscale) {
      FimError.throwOnInvalidParameter('RW+Grey');
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

      // If the texture is not readonly, create a framebuffer to back this texture
      if (!options.glReadOnly) {
        // Allocate the texture
        const format = this.getGLFormat();
        const depth = parent.getTextureDepthConstant(bpp);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, dimensions.w, dimensions.h, 0, format, depth, null);
        parent.throwWebGLErrorsDebug();

        // Create the framebuffer
        this.fb = gl.createFramebuffer();
        parent.throwWebGLErrorsDebug();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        parent.throwWebGLErrorsDebug();
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        parent.throwWebGLErrorsDebug();

        // Check the framebuffer status
        parent.throwOnIncompleteFrameBufferStatus(gl.FRAMEBUFFER, JSON.stringify(options));
      }

      this.texture = texture;
    } finally {
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  /** Texture dimensions */
  public readonly textureDimensions: FimDimensions;

  /** Image options */
  public readonly imageOptions: FimImageOptions;

  /** Throws an exception if the rectangle extends outside of the texture */
  public validateRect(rect: FimRect): void {
    const outer = FimRect.fromDimensions(this.textureDimensions);
    if (!outer.containsRect(rect)) {
      FimError.throwOnInvalidParameter(rect);
    }
  }

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
    const c = (color instanceof FimColor) ? color : FimColor.fromString(color);
    const parent = this.parentCanvas;
    const gl = parent.getContext();
    const destinationFramebuffer = this.getFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, destinationFramebuffer);
    parent.throwWebGLErrorsDebug();
    gl.viewport(0, 0, this.textureDimensions.w, this.textureDimensions.h);
    parent.throwWebGLErrorsDebug();
    gl.disable(gl.SCISSOR_TEST);
    parent.throwWebGLErrorsDebug();
    gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
    parent.throwWebGLErrorsDebug();
    gl.clear(gl.COLOR_BUFFER_BIT);
    parent.throwWebGLErrorsDebug();

    this.hasImage = true;
  }

  /**
   * Copies contents from another canvas. Supports neither cropping nor rescaling.
   * @param srcCanvas Source canvas
   */
  public copyFrom(srcCanvas: CoreCanvas): void {
    const me = this;
    const parent = me.parentCanvas;
    const gl = parent.getContext();

    // WebGL's texImage2D() will normally rescale an input image to the texture dimensions. However, if the input image
    // is greater than the maximum texture size, it returns an InvalidValue error. To avoid this, we'll explicitly
    // downscale larger images for WebGL.
    const maxDimension = parent.detectCapabilities().glMaxTextureSize;
    if (srcCanvas.canvasDimensions.w > maxDimension || srcCanvas.canvasDimensions.h > maxDimension) {
      // Slow path: first copy the source canvas to a smaller canvas
      using(srcCanvas.createTemporaryCanvas2D(me.textureDimensions), temp => {
        temp.copyFrom(srcCanvas);
        me.copyFrom(temp);
      });

      return;
    }

    // Report telemetry for debugging
    //recordTexImage2D(srcImage, this);

    me.bind(0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    parent.throwWebGLErrorsDebug();
    const format = me.getGLFormat();
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, srcCanvas.getImageSource() as HTMLImageElement);
    parent.throwWebGLErrorsDebug();
    me.unbind(0);

    me.hasImage = true;
  }

  protected disposeSelf(): void {
    const gl = this.parentCanvas.getContext();
    if (gl) {
      // Report telemetry for debugging
      // recordDispose(this, FimObjectType.GLTexture);

      if (this.texture) {
        gl.deleteTexture(this.texture);
        this.texture = undefined;
      }

      if (this.fb) {
        gl.deleteFramebuffer(this.fb);
        this.fb = undefined;
      }
    }
  }

  /** Returns the underlying WebGL framebuffer backing this texture */
  public getFramebuffer(): WebGLFramebuffer {
    const me = this;
    if (me.imageOptions.glReadOnly) {
      // Cannot write to an input only texture
      FimError.throwOnImageReadonly(me.handle);
    }
    return me.fb;
  }

  /** Returns the WebGL constant for the texture's format */
  private getGLFormat(): number {
    const me = this;
    const parent = me.parentCanvas;
    const gl = parent.getContext();
    const channels = me.imageOptions.channels;

    switch (channels) {
      case FimColorChannels.Greyscale:  return gl.LUMINANCE;
      case FimColorChannels.RGB:        return gl.RGB;
      case FimColorChannels.RGBA:       return gl.RGBA;
    }

    FimError.throwOnUnreachableCode(channels);
  }

  /**
   * Boolean indicating whether this texture has an image. Set to true by any of the copyFrom() calls, or by using this
   * texture as the output of a `CoreShader.execute()` call.
   */
  public hasImage: boolean;

  private texture: WebGLTexture;
  private fb: WebGLFramebuffer;
}
