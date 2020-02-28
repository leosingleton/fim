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
  private populateContentCanvas(): void {
    const me = this;
    me.allocateContentCanvas();

    if (me.contentCanvas.isCurrent) {
      // If a canvas is already current, this function is a no-op
      return;
    } else if (me.contentFillColor.isCurrent) {
      // Copy the fill color to the canvas to make it current
      me.contentCanvas.imageContent.fillCanvas(me.contentFillColor.imageContent);
      me.contentCanvas.isCurrent = true;
      return;
    } else if (me.contentTexture.isCurrent) {
      // TODO: Copy texture to canvas
      throw new FimError(FimErrorCode.NotImplemented);
    } else {
      throw new FimError(FimErrorCode.ImageUninitialized, me.handle);
    }
  }

  /** Ensures `contentTexture.imageContent` is allocated and contains the current image data */
  private populateContentTexture(): void {
    const me = this;
    me.allocateContentTexture();

    if (me.contentTexture.isCurrent) {
      // If a texture is already current, this function is a no-op
      return;
    } else if (me.contentFillColor.isCurrent) {
      // TODO: Fill texture with solid color
      throw new FimError(FimErrorCode.NotImplemented);
    } else if (me.contentCanvas.isCurrent) {
      // TODO: Copy canvas to texture
      throw new FimError(FimErrorCode.NotImplemented);
    } else {
      throw new FimError(FimErrorCode.ImageUninitialized, me.handle);
    }
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

  public fillSolid(color: FimColor | string): void {
    const me = this;
    me.ensureNotDisposed();

    // Force color to be a FimColor
    color = (typeof(color) !== 'string') ? color : FimColor.fromString(color);

    me.invalidateContent();
    me.contentFillColor.imageContent = color;
    me.contentFillColor.isCurrent = true;

    // TODO: release resources based on optimization settings
  }

  public getPixel(point: FimPoint): FimColor {
    const me = this;
    me.ensureNotDisposed();

    if (me.contentFillColor.isCurrent) {
      return me.contentFillColor.imageContent;
    }

    if (me.contentCanvas.isCurrent) {
      return me.contentCanvas.imageContent.getPixel(point);
    }

    // TODO: copy GL to canvas and read a pixel
    throw new FimError(FimErrorCode.NotImplemented);
  }

  public async loadPixelDataAsync(pixelData: Uint8ClampedArray, dimensions?: FimDimensions): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // Validate the array size matches the expected dimensions
    dimensions = dimensions ?? me.imageDimensions;
    const expectedLength = dimensions.getArea() * 4;
    if (pixelData.length !== expectedLength) {
      throw new FimError(FimErrorCode.InvalidDimensions, `Expected ${dimensions}`);
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

  public copyFrom(srcImage: EngineImage, srcCoords?: FimRect, destCoords?: FimRect): void {
    const me = this;
    me.ensureNotDisposed();

    // copyFrom() does not support copying from itself
    if (srcImage === this) {
      throw new FimError(FimErrorCode.InvalidParameter, '!copyFrom self');
    }

    // Ensure srcImage belongs to the same EngineFim instance
    if (me.parentObject !== srcImage.parentObject) {
      throw new FimError(FimErrorCode.InvalidParameter, 'copyFrom wrong FIM');
    }

    srcImage.populateContentCanvas();
    me.invalidateContent();
    me.allocateContentCanvas();
    me.contentCanvas.imageContent.copyFrom(srcImage.contentCanvas.imageContent, srcCoords, destCoords);
    me.contentCanvas.isCurrent = true;

    // TODO: release resources based on optimization settings
  }

  public async exportToPngAsync(): Promise<Uint8Array> {
    const me = this;
    me.ensureNotDisposed();
    me.populateContentCanvas();
    const png = await me.contentCanvas.imageContent.exportToPngAsync();

    // TODO: release resources based on optimization settings

    return png;
  }

  public async exportToJpegAsync(quality = 0.95): Promise<Uint8Array> {
    const me = this;
    me.ensureNotDisposed();
    me.populateContentCanvas();
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
