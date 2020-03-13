// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { EngineShader } from './EngineShader';
import { FimEngineOptions } from '../api/FimEngineOptions';
import { FimImage } from '../api/FimImage';
import { FimImageOptions, mergeImageOptions } from '../api/FimImageOptions';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreTexture } from '../core/CoreTexture';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';

/** Internal implementation of the FimImage interface */
export abstract class EngineImage extends EngineObject implements FimImage {
  /**
   * Constructor
   * @param fim Parent FIM object
   * @param dimensions Image dimensions
   * @param options Optional image options to override the parent FIM's defaults
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  public constructor(fim: EngineFim<EngineImage, EngineShader>, dimensions: FimDimensions, options?: FimImageOptions,
      objectName?: string) {
    super(EngineObjectType.Image, objectName, fim);
    this.imageDimensions = dimensions;
    this.imageOptions = options ?? {};
  }

  public readonly imageDimensions: FimDimensions;
  public readonly imageOptions: FimImageOptions;

  // Force parentObject to be a more specific type
  public parentObject: EngineFim<EngineImage, EngineShader>;

  /** Calculates and returns the current FIM engine options */
  public getEngineOptions(): FimEngineOptions {
    return this.parentObject.engineOptions;
  }

  /** Calculates and returns the current image options for this image */
  public getImageOptions(): FimImageOptions {
    return mergeImageOptions(this.parentObject.defaultImageOptions, this.imageOptions);
  }

  //
  // Internally, the image contents has three different representations:
  //  - A solid fill color
  //  - A DOM canvas / OffscreenCanvas
  //  - A WebGL texture
  //
  // At any time, anywhere between zero and three may be set and the rest undefined. If multiple values are set, it is
  // safe to assume that the values are equivalent.
  //

  /** Contains the color of the image if the contents are a solid color */
  private readonly contentFillColor: ImageContent<FimColor> = {
    isCurrent: false
  };

  /** Contains the contents of the image as a 2D canvas */
  private readonly contentCanvas: ImageContent<CoreCanvas2D> = {
    isCurrent: false
  };

  /** Contains the contents of the image as a WebGL texture */
  private readonly contentTexture: ImageContent<CoreTexture> = {
    isCurrent: false
  };

  /** Ensures `contentCanvas.imageContent` points to a valid 2D canvas */
  private allocateContentCanvas(): void {
    const me = this;

    // If a canvas is already allocated, this function is a no-op
    if (me.contentCanvas.imageContent) {
      return;
    }

    // TODO: calculate downscaled dimensions
    me.contentCanvas.imageContent = me.parentObject.createCoreCanvas2D(me.imageDimensions, me.handle, me.imageOptions);
  }

  /** Ensures `contentTexture.imageContent` points to a valid WebGL texture */
  private allocateContentTexture(): void {
    const me = this;

    // If a texture is already allocated, this function is a no-op
    if (me.contentTexture.imageContent) {
      return;
    }

    // TODO: calculate downscaled dimensions
    const glCanvas = me.parentObject.getWebGLCanvas();
    me.contentTexture.imageContent = glCanvas.createCoreTexture(me.imageDimensions, me.getImageOptions());
  }

  /** Sets `isCurrent` to `false` on all of the content objects */
  private invalidateContent(): void {
    const me = this;
    me.contentFillColor.isCurrent = false;
    me.contentCanvas.isCurrent = false;
    me.contentTexture.isCurrent = false;
  }

  /** Ensures `contentCanvas.imageContent` is allocated and contains the current image data */
  private async populateContentCanvas(): Promise<void> {
    const me = this;

    if (me.contentCanvas.isCurrent) {
      // If a canvas is already current, this function is a no-op
      return;
    } else if (me.contentFillColor.isCurrent) {
      // Copy the fill color to the canvas to make it current
      me.allocateContentCanvas();
      me.contentCanvas.imageContent.fillSolid(me.contentFillColor.imageContent);
      me.contentCanvas.isCurrent = true;
      return;
    } else if (me.contentTexture.isCurrent) {
      // Copy texture to the WebGL canvas
      me.allocateContentCanvas();
      const glCanvas = me.parentObject.getWebGLCanvas();
      glCanvas.copyFrom(me.contentTexture.imageContent);

      // Copy the WebGL canvas to a 2D canvas
      await me.contentCanvas.imageContent.copyFromAsync(glCanvas);
      me.contentTexture.isCurrent = true;
    } else {
      FimError.throwOnImageUninitialized(me.handle);
    }
  }

  /**
   * Ensures `contentTexture.imageContent` is allocated and contains the current image data
   * @returns The `CoreTexture` instance backing the content texture
   */
  public async populateContentTexture(): Promise<CoreTexture> {
    const me = this;

    if (me.contentTexture.isCurrent) {
      // If a texture is already current, this function is a no-op
    } else if (me.contentFillColor.isCurrent) {
      // Fill texture with solid color
      me.allocateContentTexture();
      me.contentTexture.imageContent.fillSolid(me.contentFillColor.imageContent);
      me.contentTexture.isCurrent = true;
    } else if (me.contentCanvas.isCurrent) {
      // Copy canvas to texture
      me.allocateContentTexture();
      await me.contentTexture.imageContent.copyFromAsync(me.contentCanvas.imageContent);
      me.contentTexture.isCurrent = true;
    } else {
      FimError.throwOnImageUninitialized(me.handle);
    }

    return me.contentTexture.imageContent;
  }

  /** Releases any resources used by `contentCanvas.imageContent` */
  private releaseContentCanvas(): void {
    const canvas = this.contentCanvas;
    if (canvas.imageContent) {
      canvas.imageContent.dispose();
      canvas.imageContent = undefined;
    }
  }

  /** Releases any resources used by `contentTexture.imageContent` */
  private releaseContentTexture(): void {
    const texture = this.contentTexture;
    if (texture.imageContent) {
      texture.imageContent.dispose();
      texture.imageContent = undefined;
    }
  }

  protected releaseOwnResources(flags: FimReleaseResourcesFlags): void {
    const me = this;
    me.ensureNotDisposed();

    if (flags & FimReleaseResourcesFlags.Canvas) {
      me.releaseContentCanvas();
    }

    if (flags & FimReleaseResourcesFlags.WebGLTexture) {
      me.releaseContentTexture();
    }
  }

  public async fillSolidAsync(color: FimColor | string): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // Force color to be a FimColor
    color = (typeof(color) !== 'string') ? color : FimColor.fromString(color);

    me.invalidateContent();
    me.contentFillColor.imageContent = color;
    me.contentFillColor.isCurrent = true;

    // TODO: release resources based on optimization settings
  }

  public async getPixelAsync(point: FimPoint): Promise<FimColor> {
    const me = this;
    me.ensureNotDisposed();

    // Optimization: if the image is a solid fill color, just return that color
    if (me.contentFillColor.isCurrent) {
      return me.contentFillColor.imageContent;
    }

    await me.populateContentCanvas();
    const color = me.contentCanvas.imageContent.getPixel(point);

    // TODO: release resources based on optimization settings

    return color;
  }

  public async loadPixelDataAsync(pixelData: Uint8ClampedArray, dimensions?: FimDimensions): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // Validate the array size matches the expected dimensions
    dimensions = dimensions ?? me.imageDimensions;
    const expectedLength = dimensions.getArea() * 4;
    if (pixelData.length !== expectedLength) {
      FimError.throwOnInvalidDimensions(dimensions, pixelData.length);
    }

    me.invalidateContent();
    me.allocateContentCanvas();
    await me.contentCanvas.imageContent.loadPixelDataAsync(pixelData, dimensions);
    me.contentCanvas.isCurrent = true;

    // TODO: release resources based on optimization settings
  }

  public async loadFromPngAsync(pngFile: Uint8Array, allowRescale = false): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    me.invalidateContent();
    me.allocateContentCanvas();
    await me.contentCanvas.imageContent.loadFromPngAsync(pngFile, allowRescale);
    me.contentCanvas.isCurrent = true;

    // TODO: release resources based on optimization settings
  }

  public async loadFromJpegAsync(jpegFile: Uint8Array, allowRescale = false): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    me.invalidateContent();
    me.allocateContentCanvas();
    await me.contentCanvas.imageContent.loadFromJpegAsync(jpegFile, allowRescale);
    me.contentCanvas.isCurrent = true;

    // TODO: release resources based on optimization settings
  }

  public async copyFromAsync(srcImage: EngineImage, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // copyFrom() does not support copying from itself
    if (srcImage === this) {
      throw new FimError(FimErrorCode.InvalidParameter, `${srcImage.handle} !copyFrom self`);
    }

    // Ensure srcImage belongs to the same EngineFim instance
    if (me.parentObject !== srcImage.parentObject) {
      throw new FimError(FimErrorCode.InvalidParameter, `${srcImage.handle} copyFrom wrong FIM`);
    }

    await srcImage.populateContentCanvas();
    me.invalidateContent();
    me.allocateContentCanvas();
    await me.contentCanvas.imageContent.copyFromAsync(srcImage.contentCanvas.imageContent, srcCoords, destCoords);
    me.contentCanvas.isCurrent = true;

    // TODO: release resources based on optimization settings
  }

  public async executeAsync(shader: EngineShader, destCoords?: FimRect): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // Ensure shader belongs to the same EngineFim instance
    if (me.parentObject !== shader.parentObject) {
      throw new FimError(FimErrorCode.InvalidParameter, `${shader.handle} execute on wrong FIM`);
    }

    me.invalidateContent();
    me.allocateContentTexture();
    await shader.executeAsync(me.contentTexture.imageContent, destCoords);
    me.contentTexture.isCurrent = true;

    // If the backup image option is set, immediately back up the texture to a 2D canvas in case the WebGL context gets
    // lost.
    if (me.getImageOptions().backup) {
      await me.populateContentCanvas();
    }

    // TODO: release resources based on optimization settings
  }

  public async exportToPngAsync(): Promise<Uint8Array> {
    const me = this;
    me.ensureNotDisposed();
    await me.populateContentCanvas();
    const png = await me.contentCanvas.imageContent.exportToPngAsync();

    // TODO: release resources based on optimization settings

    return png;
  }

  public async exportToJpegAsync(quality = 0.95): Promise<Uint8Array> {
    const me = this;
    me.ensureNotDisposed();
    await me.populateContentCanvas();
    const jpeg = await me.contentCanvas.imageContent.exportToJpegAsync(quality);

    // TODO: release resources based on optimization settings

    return jpeg;
  }
}

/** Wrapper around textures and canvases containing the image content */
interface ImageContent<T> {
  /** Texture or canvas containing the image content. May be undefined if unallocated. */
  imageContent?: T;

  /** True if `imageContent` contains the latest image. False if it is out-of-date. */
  isCurrent: boolean;
}
