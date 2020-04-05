// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { EngineShader } from './EngineShader';
import { CanvasImageContent, ImageContent, TextureImageContent } from './ImageContent';
import { ImageType } from './optimizer/ImageType';
import { FimEngineOptions } from '../api/FimEngineOptions';
import { FimImage } from '../api/FimImage';
import { FimImageOptions, mergeImageOptions } from '../api/FimImageOptions';
import { FimObject } from '../api/FimObject';
import { FimOperation } from '../api/FimOperation';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreTexture } from '../core/CoreTexture';
import { CoreTextureOptions } from '../core/CoreTextureOptions';
import { FimColor } from '../primitives/FimColor';
import { FimDimensional } from '../primitives/FimDimensional';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';
import { deepCopy } from '@leosingleton/commonlibs';

/** Internal implementation of the FimImage interface */
export abstract class EngineImage extends EngineObject implements FimDimensional, FimImage {
  /**
   * Constructor
   * @param parent Parent object
   * @param options Optional image options to override the parent FIM's defaults
   * @param dimensions Optional image dimensions. Defaults to `maxImageDimensions` of the parent FIM object.
   * @param name An optional name specified when creating the object to help with debugging
   */
  public constructor(parent: FimObject, options?: FimImageOptions, dimensions?: FimDimensions, name?: string) {
    super(EngineObjectType.Image, name, parent);
    this.dim = dimensions ?? this.rootObject.maxImageDimensions;
    this.imageOptions = deepCopy(options) ?? {};

    const root = this.rootObject;
    root.optimizer.recordImageCreate(this);
  }

  public dispose(): void {
    this.rootObject.optimizer.recordImageDispose(this);
    super.dispose();
  }

  public readonly dim: FimDimensions;
  public readonly imageOptions: FimImageOptions;

  public getEffectiveImageOptions(): FimImageOptions {
    const me = this;

    // Start by merging this object's imageOptions with those inherited from the parent
    let options = me.getImageOptions();

    let canvasDownscale: number;
    const canvas = me.contentCanvas.imageContent;
    if (canvas) {
      // Override with any canvas options that may have been set prior to canvas creation
      canvasDownscale = me.contentCanvas.downscale;
    } else {
      // Calculate any options which would get applied on the next canvas creation
      const dd = me.contentCanvas.calculateDimensionsAndDownscale();
      canvasDownscale = dd.downscale;
    }
    options = mergeImageOptions(options, {
      downscale: canvasDownscale
    });

    let textureDownscale: number;
    let textureOptions: CoreTextureOptions;
    const texture = me.contentTexture.imageContent;
    if (texture) {
      // Override with any texture options that may have been set prior to texture creation
      textureDownscale = me.contentTexture.downscale;
      textureOptions = texture.textureOptions;
    } else {
      // Calculate any options which would get applied on the next texture creation
      const dd = me.contentTexture.calculateDimensionsAndDownscale();
      textureDownscale = dd.downscale;
      textureOptions = me.contentTexture.getOptions();
    }
    options = mergeImageOptions(options, {
      bpp: textureOptions.bpp,
      glDownscale: textureDownscale,
      sampling: textureOptions.sampling
    });

    return options;
  }

  /** Calculates and returns the current FIM engine options */
  public getEngineOptions(): FimEngineOptions {
    return this.rootObject.engineOptions;
  }

  /** Calculates and returns the current image options for this image */
  public getImageOptions(): FimImageOptions {
    return mergeImageOptions(this.rootObject.defaultImageOptions, this.imageOptions);
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
  public readonly contentFillColor = new ImageContent<FimColor>();

  /** Contains the contents of the image as a 2D canvas */
  public readonly contentCanvas = new CanvasImageContent(this);

  /** Contains the contents of the image as a WebGL texture */
  public readonly contentTexture = new TextureImageContent(this);

  /** Returns `true` if any of the image representations have `isCurrent === true` */
  public hasImage(): boolean {
    const me = this;
    return me.contentFillColor.isCurrent || me.contentCanvas.isCurrent || me.contentTexture.isCurrent;
  }

  /**
   * Marks one of the image content values as current
   * @param ic The `ImageContent` object to mark as current
   * @param invalidateOthers If `true`, all other `ImageContent` objects are marked as not current
   */
  public markCurrent<TContent>(ic: ImageContent<TContent>, invalidateOthers: boolean): void {
    const me = this;

    if (invalidateOthers) {
      me.contentFillColor.isCurrent = false;
      me.contentCanvas.isCurrent = false;
      me.contentTexture.isCurrent = false;
    }

    ic.isCurrent = true;
  }

  /**
   * Boolean used to ensure we only log an auto-downscale warning once per image. It is located here to avoid logging
   * the same warning both for the texture and canvas backing the image.
   */
  public autoDownscaleWarningLogged = false;

  /**
   * Returns a WebGL texture containing the current image contents
   * @returns The `CoreTexture` instance backing the content texture
   */
  public populateContentTextureAsync(): Promise<CoreTexture> {
    return this.contentTexture.populateContentAsync();
  }

  protected releaseOwnResources(flags: FimReleaseResourcesFlags): void {
    const me = this;
    me.ensureNotDisposed();

    if (flags & FimReleaseResourcesFlags.Canvas) {
      me.contentCanvas.releaseContent();
    }

    if (flags & FimReleaseResourcesFlags.WebGLTexture) {
      me.contentTexture.releaseContent();

      // Handle the image option to fill the image with a solid color if we lost the image contents
      if (!me.hasImage()) {
        const imageOptions = me.getImageOptions();
        if (imageOptions.fillColorOnContextLost) {
          me.contentFillColor.imageContent = imageOptions.fillColorOnContextLost;
          me.markCurrent(me.contentFillColor, true);
        }
      }
    }
  }

  public async backupAsync(): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    if (me.contentTexture.isCurrent && !me.contentFillColor.isCurrent && !me.contentCanvas.isCurrent) {
      // The WebGL texture is the only copy of the image contents and needs to be backed up to a canvas
      await me.contentCanvas.populateContentAsync();

      // Let the optimizer release unneeded resources
      me.rootObject.optimizer.releaseResources();
    }
  }

  public async fillSolidAsync(color: FimColor | string): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // Force color to be a FimColor
    color = (typeof(color) !== 'string') ? color : FimColor.fromString(color);

    me.contentFillColor.imageContent = color;
    me.markCurrent(me.contentFillColor, true);

    // Let the optimizer release unneeded resources
    me.rootObject.optimizer.releaseResources();
  }

  public async getPixelAsync(point: FimPoint): Promise<FimColor> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    me.ensureNotDisposed();

    // Optimization: if the image is a solid fill color, just return that color
    if (me.contentFillColor.isCurrent) {
      return me.contentFillColor.imageContent;
    }

    await me.contentCanvas.populateContentAsync();
    const scaledPoint = point.rescale(me.contentCanvas.downscale);
    const color = me.contentCanvas.imageContent.getPixel(scaledPoint);

    // Let the optimizer release unneeded resources
    optimizer.recordImageRead(me, ImageType.Canvas);
    optimizer.releaseResources();

    return color;
  }

  public async loadPixelDataAsync(pixelData: Uint8ClampedArray, dimensions?: FimDimensions): Promise<void> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    me.ensureNotDisposed();

    // Validate the array size matches the expected dimensions
    dimensions = dimensions ?? me.dim;
    const expectedLength = dimensions.getArea() * 4;
    if (pixelData.length !== expectedLength) {
      FimError.throwOnInvalidDimensions(dimensions, pixelData.length);
    }

    me.contentCanvas.allocateContent(dimensions);
    await me.contentCanvas.imageContent.loadPixelDataAsync(pixelData, dimensions);
    me.markCurrent(me.contentCanvas, true);

    // Let the optimizer release unneeded resources
    optimizer.recordImageWrite(me, ImageType.Canvas);
    optimizer.releaseResources();
  }

  public async loadFromPngAsync(pngFile: Uint8Array, allowRescale = false): Promise<void> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    me.ensureNotDisposed();

    me.contentCanvas.allocateContent();
    // BUGBUG: If the underlying 2D canvas isn't the same dimensions as this image, we always treat allowRescale as
    //    true. This makes the FIM library behave as it should in normal cases. However if the PNG file's dimensions
    //    don't match the EngineImage's, it will succeed rather than fail as expected.
    allowRescale = allowRescale || (me.contentCanvas.downscale !== 1);
    await me.contentCanvas.imageContent.loadFromPngAsync(pngFile, allowRescale);
    me.markCurrent(me.contentCanvas, true);

    // Let the optimizer release unneeded resources
    optimizer.recordImageWrite(me, ImageType.Canvas);
    optimizer.releaseResources();
  }

  public async loadFromJpegAsync(jpegFile: Uint8Array, allowRescale = false): Promise<void> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    me.ensureNotDisposed();

    me.contentCanvas.allocateContent();
    // BUGBUG: If the underlying 2D canvas isn't the same dimensions as this image, we always treat allowRescale as
    //    true. This makes the FIM library behave as it should in normal cases. However if the JPEG file's dimensions
    //    don't match the EngineImage's, it will succeed rather than fail as expected.
    allowRescale = allowRescale || (me.contentCanvas.downscale !== 1);
    await me.contentCanvas.imageContent.loadFromJpegAsync(jpegFile, allowRescale);
    me.markCurrent(me.contentCanvas, true);

    // Let the optimizer release unneeded resources
    optimizer.recordImageWrite(me, ImageType.Canvas);
    optimizer.releaseResources();
  }

  public async copyFromAsync(srcImage: EngineImage, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    const srcContentCanvas = srcImage.contentCanvas;
    const destContentCanvas = me.contentCanvas;
    me.ensureNotDisposed();

    // copyFrom() does not support copying from itself
    if (srcImage === this) {
      throw new FimError(FimErrorCode.InvalidParameter, `${srcImage.handle} !copyFrom self`);
    }

    // Ensure srcImage belongs to the same EngineFim instance
    if (me.parentObject !== srcImage.parentObject) {
      throw new FimError(FimErrorCode.InvalidParameter, `${srcImage.handle} copyFrom wrong FIM`);
    }

    // Handle defaults and validate coordinates
    srcCoords = srcCoords ?? FimRect.fromDimensions(srcImage.dim);
    destCoords = destCoords ?? FimRect.fromDimensions(me.dim);
    srcCoords.validateIn(srcImage);
    destCoords.validateIn(me);

    await srcContentCanvas.populateContentAsync();
    await destContentCanvas.allocateOrPopulateContentAsync(destCoords, srcCoords.dim);

    const scaledSrcCoords = srcCoords.rescale(srcContentCanvas.downscale).toFloor();
    const scaledDestCoords = destCoords.rescale(destContentCanvas.downscale).toFloor();
    await destContentCanvas.imageContent.copyFromAsync(srcContentCanvas.imageContent, scaledSrcCoords,
      scaledDestCoords);
    me.markCurrent(destContentCanvas, true);

    // Let the optimizer release unneeded resources
    optimizer.recordImageRead(srcImage, ImageType.Canvas);
    optimizer.recordImageWrite(me, ImageType.Canvas);
    optimizer.releaseResources();
  }

  public async executeAsync(shaderOrOperation: EngineShader | FimOperation, destCoords?: FimRect): Promise<void> {
    const me = this;
    const root = me.rootObject;
    const optimizer = root.optimizer;
    const contentTexture = me.contentTexture;
    me.ensureNotDisposed();

    // Ensure shader belongs to the same EngineFim instance
    if (me.rootObject !== shaderOrOperation.rootObject) {
      throw new FimError(FimErrorCode.InvalidParameter, `${shaderOrOperation.handle} execute on wrong FIM`);
    }

    // Handle operations separately from shaders
    if (shaderOrOperation instanceof FimOperation) {
      return shaderOrOperation.executeAsync(me, destCoords);
    }

    // Handle defaults and validate coordinates
    destCoords = destCoords ?? FimRect.fromDimensions(me.dim);
    destCoords.validateIn(me);

    await contentTexture.allocateOrPopulateContentAsync(destCoords);

    const scaledDestCoords = destCoords.rescale(contentTexture.downscale);
    if (shaderOrOperation.uniformsContainEngineImage(me)) {
      // Special case: We are using this image both as an input and and output. Using a single texture as both input and
      // output isn't supported by WebGL, but we work around this by creating a temporary WebGL texture.
      const glCanvas = root.getWebGLCanvas();
      const outputTexture = glCanvas.createCoreTexture(contentTexture.getOptions(), contentTexture.imageContent.dim);
      try {
        root.resources.recordCreate(me, outputTexture);
        await shaderOrOperation.executeAsync(outputTexture, scaledDestCoords);
      } catch (err) {
        root.resources.recordDispose(me, outputTexture);
        outputTexture.dispose();
        throw err;
      }
      contentTexture.releaseContent();
      contentTexture.imageContent = outputTexture;
    } else {
      // Normal case: we can write to the normal WebGL texture as it is not an input to the shader.
      await shaderOrOperation.executeAsync(contentTexture.imageContent, scaledDestCoords);
    }

    me.markCurrent(contentTexture, true);
    optimizer.recordShaderUsage(shaderOrOperation);
    optimizer.recordImageWrite(me, ImageType.Texture);

    // If the backup image option is set, immediately back up the texture to a 2D canvas in case the WebGL context gets
    // lost.
    if (me.getImageOptions().autoBackup) {
      await me.backupAsync();
    }

    // Let the optimizer release unneeded resources
    optimizer.releaseResources();
  }

  public async exportToPixelDataAsync(srcCoords?: FimRect): Promise<Uint8ClampedArray> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    me.ensureNotDisposed();

    // Handle defaults and validate coordinates
    srcCoords = srcCoords ?? FimRect.fromDimensions(me.dim);
    srcCoords.validateIn(me);

    await me.contentCanvas.populateContentAsync();
    let pixelData: Uint8ClampedArray;
    if (me.contentCanvas.downscale === 1) {
      // Fast case: No rescale required
      pixelData = await me.contentCanvas.imageContent.exportToPixelData(srcCoords);
    } else {
      // Slow case: Use a temporary 2D canvas
      pixelData = await me.exportToRescaleHelperAsync(srcCoords,
        async scaledCanvas => scaledCanvas.exportToPixelData());
    }

    // Let the optimizer release unneeded resources
    optimizer.recordImageRead(me, ImageType.Canvas);
    optimizer.releaseResources();

    return pixelData;
  }

  /**
   * Helper function to implement a platform-specific `exportToCanvasAsync()` function which copies this image's
   * contents to a canvas
   * @param exportLambda Lambda function to export the contents of `srcCanvas` to the output canvas, based on the
   *    populated and scaled `srcCoords` and `destCoords` parameters
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   * @param destCoords Destination coordinates to render to. If unspecified, the output is stretched to fit the entire
   *    canvas.
   */
  protected async exportToCanvasHelperAsync(
      exportLambda: (srcCanvas: CoreCanvas2D, srcCoords: FimRect, destCoords: FimRect) => Promise<void>,
      srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    me.ensureNotDisposed();

    // Handle defaults and validate coordinates
    srcCoords = srcCoords ?? FimRect.fromDimensions(me.dim);
    srcCoords.validateIn(me);

    await me.contentCanvas.populateContentAsync();
    const scaledSrcCoords = srcCoords.rescale(me.contentCanvas.downscale).toFloor();
    await exportLambda(me.contentCanvas.imageContent, scaledSrcCoords, destCoords);

    // Let the optimizer release unneeded resources
    optimizer.recordImageRead(me, ImageType.Canvas);
    optimizer.releaseResources();
  }

  public async exportToPngAsync(): Promise<Uint8Array> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    me.ensureNotDisposed();

    await me.contentCanvas.populateContentAsync();
    let png: Uint8Array;
    if (me.contentCanvas.downscale === 1) {
      // Fast case: No rescale required
      png = await me.contentCanvas.imageContent.exportToPngAsync();
    } else {
      // Slow case: Use a temporary 2D canvas
      png = await me.exportToRescaleHelperAsync(FimRect.fromDimensions(me.dim),
        async scaledCanvas => scaledCanvas.exportToPngAsync());
    }

    // Let the optimizer release unneeded resources
    optimizer.recordImageRead(me, ImageType.Canvas);
    optimizer.releaseResources();

    return png;
  }

  public async exportToJpegAsync(quality = 0.95): Promise<Uint8Array> {
    const me = this;
    const optimizer = me.rootObject.optimizer;
    me.ensureNotDisposed();

    await me.contentCanvas.populateContentAsync();
    let jpeg: Uint8Array;
    if (me.contentCanvas.downscale === 1) {
      // Fast case: No rescale required
      jpeg = await me.contentCanvas.imageContent.exportToJpegAsync(quality);
    } else {
      // Slow case: Use a temporary 2D canvas
      jpeg = await me.exportToRescaleHelperAsync(FimRect.fromDimensions(me.dim),
        async scaledCanvas => scaledCanvas.exportToJpegAsync(quality));
    }

    // Let the optimizer release unneeded resources
    optimizer.recordImageRead(me, ImageType.Canvas);
    optimizer.releaseResources();

    return jpeg;
  }

  /**
   * Helper function to copy the desired portion of the image to a temporary 2D canvas while rescaling, then execute
   * an asynchronous lambda function. This is used by the `exportToXYZ()` calls to handle the case where the underlying
   * canvas has been downscaled from the `EngineImage` dimensions. The caller expects the result to have the dimensions
   * of the `EngineImage` instance, and rescaling pixel data in JavaScript is slow and worse quality compared to doing
   * it with canvas operations.
   * @param srcCoords Source coordinates (not rescaled) to export from the `contentCanvas`
   * @param exportLambda Asynchronous lambda to execute with the temporary rescaled canvas
   * @returns Return value from `exportLambda`
   */
  private async exportToRescaleHelperAsync<T>(srcCoords: FimRect,
      exportLambda: (scaledCanvas: CoreCanvas2D) => Promise<T>): Promise<T> {
    const me = this;
    const root = me.rootObject;
    let result: T;

    // Slow case: Copy the desired portion of the image to a temporary 2D canvas while rescaling, then export the
    // temporary canvas. Rescaling pixel data in JavaScript is slow and doesn't do as good of a job of image
    // smoothing.
    const temp = root.createCoreCanvas2D(me.contentCanvas.getOptions(), srcCoords.dim, `${me.handle}/RescaleHelper`);
    try {
      root.resources.recordCreate(me, temp);

      const scaledSrcCoords = srcCoords.rescale(me.contentCanvas.downscale);
      await temp.copyFromAsync(me.contentCanvas.imageContent, scaledSrcCoords);
      result = await exportLambda(temp);
    } finally {
      root.resources.recordDispose(me, temp);
      temp.dispose();
    }

    return result;
  }
}
