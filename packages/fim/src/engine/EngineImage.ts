// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { EngineShader } from './EngineShader';
import { CanvasImageContent, ImageContent, TextureImageContent } from './ImageContent';
import { ModuleCreateDispose, ModuleImageFormat, ModuleImageOperation,
  ModuleOperationType } from './modules/ModuleBase';
import { FimEngineOptions } from '../api/FimEngineOptions';
import { FimImage } from '../api/FimImage';
import { FimImageOptions, mergeImageOptions } from '../api/FimImageOptions';
import { FimObject } from '../api/FimObject';
import { FimOperation } from '../api/FimOperation';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreMimeType } from '../core/CoreMimeType';
import { CoreTexture } from '../core/CoreTexture';
import { CoreTextureOptions } from '../core/CoreTextureOptions';
import { ImageSource } from '../core/types/ImageSource';
import { FimColor } from '../primitives/FimColor';
import { FimDimensional } from '../primitives/FimDimensional';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';
import { deepCopy, Stopwatch } from '@leosingleton/commonlibs';

/** Internal implementation of the FimImage interface */
export abstract class EngineImage extends EngineObject implements FimDimensional, FimImage {
  /**
   * Constructor
   * @param parent Parent object
   * @param dimensions Image dimensions
   * @param options Image options to override the parent FIM's defaults
   * @param name An optional name specified when creating the object to help with debugging
   */
  public constructor(parent: FimObject, dimensions: FimDimensions, options: FimImageOptions, name?: string) {
    super(EngineObjectType.Image, name, parent);
    this.dim = dimensions;
    this.imageOptions = deepCopy(options);

    const root = this.rootObject;
    root.optimizer.onEngineObjectCreateDispose(this, ModuleCreateDispose.Create);
  }

  public dispose(): void {
    this.rootObject.notifyModules(module => module.onEngineObjectCreateDispose(this, ModuleCreateDispose.Dispose));
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
      textureOptions = me.contentTexture.getDesiredOptions(true);
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
    color = FimColor.fromColorOrString(color);

    me.contentFillColor.imageContent = color;
    me.markCurrent(me.contentFillColor, true);

    // Let the optimizer release unneeded resources
    me.rootObject.optimizer.releaseResources();
  }

  public async getPixelAsync(point: FimPoint): Promise<FimColor> {
    const me = this;
    const root = me.rootObject;
    me.ensureNotDisposed();

    // Optimization: if the image is a solid fill color, just return that color
    if (me.contentFillColor.isCurrent) {
      return me.contentFillColor.imageContent;
    }

    await me.contentCanvas.populateContentAsync();
    const scaledPoint = point.rescale(me.contentCanvas.downscale);
    const color = me.contentCanvas.imageContent.getPixel(scaledPoint);

    // Let the optimizer release unneeded resources
    root.notifyModules(module => module.onImageOperation(me, ModuleImageFormat.Canvas, ModuleOperationType.ImportExport,
      ModuleImageOperation.Read));
    root.optimizer.releaseResources();

    return color;
  }

  public async loadPixelDataAsync(pixelData: Uint8ClampedArray, dimensions?: FimDimensions): Promise<void> {
    const me = this;
    const root = me.rootObject;
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
    root.notifyModules(module => module.onImageOperation(me, ModuleImageFormat.Canvas, ModuleOperationType.ImportExport,
      ModuleImageOperation.Write));
    root.optimizer.releaseResources();
  }

  /**
   * Loads the image contents from an `HTMLImageElement`-like object. Automatically rescales the contents to fit the
   * full image.
   * @param image Image object. The caller is responsible for first waiting for the `onload` event of the image before
   *    calling this function.
   */
  public loadFromImage(image: ImageSource): void {
    const me = this;
    const root = me.rootObject;
    me.ensureNotDisposed();

    me.contentCanvas.allocateContent(FimDimensions.fromObject(image));
    me.contentCanvas.imageContent.loadFromImage(image);
    me.markCurrent(me.contentCanvas, true);

    // Let the optimizer release unneeded resources
    root.notifyModules(module => module.onImageOperation(me, ModuleImageFormat.Canvas, ModuleOperationType.ImportExport,
      ModuleImageOperation.Write));
    root.optimizer.releaseResources();
  }

  public async loadFromPngAsync(pngFile: Uint8Array, allowRescale = false): Promise<void> {
    return this.loadFromFileAsync(pngFile, CoreMimeType.PNG, allowRescale);
  }

  public async loadFromJpegAsync(jpegFile: Uint8Array, allowRescale = false): Promise<void> {
    return this.loadFromFileAsync(jpegFile, CoreMimeType.JPEG, allowRescale);
  }

  private async loadFromFileAsync(file: Uint8Array, type: CoreMimeType, allowRescale: boolean): Promise<void> {
    const me = this;

    return me.rootObject.imageLoaderAsync(file, type, image => {
      // If allowRescale is disabled, explicitly check the dimensions here. We can't pass allowRescale parameter down
      // to CoreCanvas2D.loadFromImage, because it may be a different set of dimensions due to auto-downscaling.
      const imageDimensions = FimDimensions.fromObject(image);
      if (!allowRescale && !imageDimensions.equals(me.dim)) {
        FimError.throwOnInvalidDimensions(me.dim, imageDimensions);
      }

      me.loadFromImage(image);
    });
  }

  public async loadFromPngFileAsync(pngUrl: string, allowRescale?: boolean): Promise<void> {
    const pngFile = await this.rootObject.fileReaderAsync(pngUrl);
    return this.loadFromPngAsync(pngFile, allowRescale);
  }

  public async loadFromJpegFileAsync(jpegUrl: string, allowRescale?: boolean): Promise<void> {
    const jpegFile = await this.rootObject.fileReaderAsync(jpegUrl);
    return this.loadFromPngAsync(jpegFile, allowRescale);
  }

  public async copyFromAsync(srcImage: EngineImage, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    const me = this;
    const root = me.rootObject;
    const srcContentCanvas = srcImage.contentCanvas;
    const destContentCanvas = me.contentCanvas;
    me.ensureNotDisposed();

    // copyFrom() does not support copying from itself
    if (srcImage === this) {
      throw new FimError(FimErrorCode.InvalidParameter, `${srcImage.objectHandle} !copyFrom self`);
    }

    // Ensure srcImage belongs to the same EngineFim instance
    me.ensureSameRoot(srcImage);

    // Handle defaults and validate coordinates
    srcCoords = srcCoords ?? FimRect.fromDimensions(srcImage.dim);
    destCoords = destCoords ?? FimRect.fromDimensions(me.dim);
    srcCoords.validateIn(srcImage);
    destCoords.validateIn(me);

    await srcContentCanvas.populateContentAsync();
    await destContentCanvas.allocateOrPopulateContentAsync(destCoords, false, srcCoords.dim);

    const scaledSrcCoords = srcCoords.rescale(srcContentCanvas.downscale).toFloor();
    const scaledDestCoords = destCoords.rescale(destContentCanvas.downscale).toFloor();
    await destContentCanvas.imageContent.copyFromAsync(srcContentCanvas.imageContent, scaledSrcCoords,
      scaledDestCoords);
    me.markCurrent(destContentCanvas, true);

    // Let the optimizer release unneeded resources
    root.notifyModules(module => module.onImageOperation(srcImage, ModuleImageFormat.Canvas,
      ModuleOperationType.Explicit, ModuleImageOperation.Read));
    root.notifyModules(module => module.onImageOperation(me, ModuleImageFormat.Canvas,
      ModuleOperationType.Explicit, ModuleImageOperation.Write));
    root.optimizer.releaseResources();
  }

  public async executeAsync(shaderOrOperation: EngineShader | FimOperation, destCoords?: FimRect): Promise<void> {
    const me = this;
    const root = me.rootObject;
    const contentTexture = me.contentTexture;
    me.ensureNotDisposed();

    // Ensure shader belongs to the same EngineFim instance
    me.ensureSameRoot(shaderOrOperation);

    // Handle operations separately from shaders
    if (shaderOrOperation instanceof FimOperation) {
      return shaderOrOperation.executeAsync(me, destCoords);
    }

    // Ensure the WebGL canvas is large enough to handle this image. This function call will resize it if needed.
    await root.allocateWebGLCanvasAsync(me.dim);

    // Handle defaults and validate coordinates
    destCoords = destCoords ?? FimRect.fromDimensions(me.dim);
    destCoords.validateIn(me);

    // By default, we leave it up to allocateOrPopulateContentAsync to decide whether the output image needs to be
    // populated based on the destination coordinates.
    await contentTexture.allocateOrPopulateContentAsync(destCoords, shaderOrOperation.hasNonDefaultVertices(),
      undefined, true);

    const glCanvas = root.getWebGLCanvas();
    const scaledDestCoords = destCoords.rescale(contentTexture.downscale);
    let executionTime: number;
    let pixelCount: number;
    if (shaderOrOperation.uniformsContainEngineImage(me)) {
      // Special case: We are using this image both as an input and and output. Using a single texture as both input and
      // output isn't supported by WebGL, but we work around this by creating a temporary WebGL texture.
      const outputTexture = glCanvas.createCoreTexture(contentTexture.imageContent.dim,
        contentTexture.getDesiredOptions(true));
      try {
        root.notifyModules(module => module.onCoreObjectCreateDispose(me, outputTexture, ModuleCreateDispose.Create));
        const stopwatch = Stopwatch.startNew();
        await shaderOrOperation.executeAsync(glCanvas, outputTexture, scaledDestCoords);
        executionTime = stopwatch.getElapsedMilliseconds();
        pixelCount = outputTexture.dim.getArea();
      } catch (err) {
        root.notifyModules(module => module.onCoreObjectCreateDispose(me, outputTexture, ModuleCreateDispose.Dispose));
        outputTexture.dispose();
        throw err;
      }
      contentTexture.releaseContent();
      contentTexture.imageContent = outputTexture;
    } else {
      // Normal case: we can write to the normal WebGL texture as it is not an input to the shader.
      const stopwatch = Stopwatch.startNew();
      await shaderOrOperation.executeAsync(glCanvas, contentTexture.imageContent, scaledDestCoords);
      executionTime = stopwatch.getElapsedMilliseconds();
      pixelCount = contentTexture.imageContent.dim.getArea();
    }

    me.markCurrent(contentTexture, true);
    root.notifyModules(module => module.onShaderExecution(shaderOrOperation, executionTime, pixelCount / 1000000));
    root.notifyModules(module => module.onImageOperation(me, ModuleImageFormat.Texture, ModuleOperationType.Explicit,
      ModuleImageOperation.Write));

    // If the backup image option is set, immediately back up the texture to a 2D canvas in case the WebGL context gets
    // lost.
    if (me.getImageOptions().autoBackup) {
      await me.backupAsync();
    }

    // Let the optimizer release unneeded resources
    root.optimizer.releaseResources();
  }

  public exportToPixelDataAsync(srcCoords?: FimRect): Promise<Uint8ClampedArray> {
    return this.exportToInternalAsync(async srcCanvas => srcCanvas.exportToPixelData(srcCoords));
  }

  /**
   * Helper function to implement a platform-specific `exportToCanvasAsync()` function which copies this image's
   * contents to a canvas
   * @param exportLambda Lambda function to export the contents of `srcCanvas` to the output canvas, based on the
   *    populated and scaled `scaledSrcCoords` parameter
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   */
  protected async exportToCanvasHelperAsync(
      exportLambda: (srcCanvas: CoreCanvas2D, scaledSrcCoords: FimRect) => Promise<void>, srcCoords?: FimRect):
      Promise<void> {
    const me = this;
    const root = me.rootObject;
    me.ensureNotDisposed();

    // Handle defaults and validate coordinates
    srcCoords = srcCoords ?? FimRect.fromDimensions(me.dim);
    srcCoords.validateIn(me);

    await me.contentCanvas.populateContentAsync();
    const scaledSrcCoords = srcCoords.rescale(me.contentCanvas.downscale).toFloor();
    await exportLambda(me.contentCanvas.imageContent, scaledSrcCoords);

    // Let the optimizer release unneeded resources
    root.notifyModules(module => module.onImageOperation(me, ModuleImageFormat.Canvas, ModuleOperationType.ImportExport,
      ModuleImageOperation.Read));
    root.optimizer.releaseResources();
  }

  public exportToPngAsync(): Promise<Uint8Array> {
    return this.exportToInternalAsync(srcCanvas => srcCanvas.exportToPngAsync());
  }

  public exportToJpegAsync(quality = 0.95): Promise<Uint8Array> {
    return this.exportToInternalAsync(srcCanvas => srcCanvas.exportToJpegAsync(quality));
  }

  /**
   * Internal implementation of `exportToPngAsync()` and `exportToJpegAsync()`
   * @param exportLambda Asynchronous lambda to execute to perform the `CoreCanvas2D` to PNG/JPEG conversion
   * @returns Return value from `exportLambda`
   */
  protected async exportToInternalAsync<T>(exportLambda: (srcCanvas: CoreCanvas2D) => Promise<T>): Promise<T> {
    const me = this;
    const root = me.rootObject;
    me.ensureNotDisposed();

    await me.contentCanvas.populateContentAsync();
    let result: T;
    if (me.contentCanvas.downscale === 1) {
      // Fast case: No rescale required
      result = await exportLambda(me.contentCanvas.imageContent);
    } else {
      // Slow case: Use a temporary 2D canvas
      result = await me.exportToRescaleHelperAsync(FimRect.fromDimensions(me.dim), exportLambda);
    }

    // Let the optimizer release unneeded resources
    root.notifyModules(module => module.onImageOperation(me, ModuleImageFormat.Canvas, ModuleOperationType.ImportExport,
      ModuleImageOperation.Read));
    root.optimizer.releaseResources();

    return result;
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
    const temp = root.createCoreCanvas2D(srcCoords.dim, me.contentCanvas.getDesiredOptions(false),
      `${me.objectHandle}/RescaleHelper`);
    try {
      root.notifyModules(module => module.onCoreObjectCreateDispose(me, temp, ModuleCreateDispose.Create));

      const scaledSrcCoords = srcCoords.rescale(me.contentCanvas.downscale);
      await temp.copyFromAsync(me.contentCanvas.imageContent, scaledSrcCoords);
      result = await exportLambda(temp);
    } finally {
      root.notifyModules(module => module.onCoreObjectCreateDispose(me, temp, ModuleCreateDispose.Dispose));
      temp.dispose();
    }

    return result;
  }
}
