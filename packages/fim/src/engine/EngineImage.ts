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
import { FimOperation } from '../api/FimOperation';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasOptions, CoreTextureOptions } from '../core/CoreOptions';
import { CoreTexture } from '../core/CoreTexture';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';
import { deepCopy } from '@leosingleton/commonlibs';

/** Internal implementation of the FimImage interface */
export abstract class EngineImage extends EngineObject implements FimImage {
  /**
   * Constructor
   * @param fim Parent FIM object
   * @param options Optional image options to override the parent FIM's defaults
   * @param dimensions Optional image dimensions. Defaults to `maxImageDimensions` of the parent FIM object.
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  public constructor(fim: EngineFim<EngineImage, EngineShader>, options?: FimImageOptions, dimensions?: FimDimensions,
      objectName?: string) {
    super(EngineObjectType.Image, objectName, fim);
    this.imageDimensions = dimensions ?? fim.maxImageDimensions;
    this.imageOptions = deepCopy(options) ?? {};
  }

  public readonly imageDimensions: FimDimensions;
  public readonly imageOptions: FimImageOptions;

  /** Boolean value returned by `hasImage()` */
  private hasImageValue = false;

  public hasImage(): boolean {
    return this.hasImageValue;
  }

  public getEffectiveImageOptions(): FimImageOptions {
    const me = this;

    // Start by merging this object's imageOptions with those inherited from the parent
    let options = me.getImageOptions();

    // glDownscale is effectively the min of the image downscale and WebGL downscale
    options.glDownscale = Math.min(options.glDownscale, options.downscale);

    // Override with any canvas options which don't take effect after canvas creation
    const canvas = me.contentCanvas.imageContent;
    if (canvas) {
      options = mergeImageOptions(options, {
        downscale: canvas.canvasOptions.downscale
      });
    }

    // Override with any texture options which don't take effect after canvas creation
    const texture = me.contentTexture.imageContent;
    if (texture) {
      options = mergeImageOptions(options, {
        bpp: texture.textureOptions.bpp,
        glDownscale: texture.textureOptions.downscale,
        sampling: texture.textureOptions.sampling
      });
    }

    return options;
  }

  // Force parentObject to be a more specific type
  public parentObject: EngineFim<EngineImage, EngineShader>;

  /** Calculates and returns the current FIM engine options */
  public getEngineOptions(): FimEngineOptions {
    return this.parentObject.engineOptions;
  }

  /** Calculates and returns the current image options for this image */
  private getImageOptions(): FimImageOptions {
    return mergeImageOptions(this.parentObject.defaultImageOptions, this.imageOptions);
  }

  /** Calculates and returns the `CoreCanvasOptions` for creating a new canvas */
  public getCanvasOptions(): CoreCanvasOptions {
    const options = this.getImageOptions();
    return {
      downscale: options.downscale
    };
  }

  /** Calculates and returns the `CoreTextureOptions` for creating a new texture */
  public getTextureOptions(): CoreTextureOptions {
    const options = this.getImageOptions();
    return {
      bpp: options.bpp,
      downscale: options.downscale,
      isReadOnly: options.glReadOnly,
      sampling: options.sampling
    };
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
    me.contentCanvas.imageContent = me.parentObject.createCoreCanvas2D(me.imageOptions, me.imageDimensions, me.handle);
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
    me.contentTexture.imageContent = glCanvas.createCoreTexture(me.getTextureOptions(), me.imageDimensions);
  }

  /**
   * Marks one of the image content values as current
   * @param ic The `ImageContent` object to mark as current
   * @param invalidateOthers If `true`, all other `ImageContent` objects are marked as not current
   */
  private markCurrent<T>(ic: ImageContent<T>, invalidateOthers: boolean): void {
    const me = this;

    if (invalidateOthers) {
      me.contentFillColor.isCurrent = false;
      me.contentCanvas.isCurrent = false;
      me.contentTexture.isCurrent = false;
    }

    ic.isCurrent = true;
    me.hasImageValue = true;
  }

  /** Ensures `contentCanvas.imageContent` is allocated and contains the current image data */
  private async populateContentCanvas(): Promise<void> {
    const me = this;

    if (me.contentCanvas.isCurrent) {
      // If a canvas is already current, this function is a no-op
    } else if (me.contentFillColor.isCurrent) {
      // Copy the fill color to the canvas to make it current
      me.allocateContentCanvas();
      me.contentCanvas.imageContent.fillSolid(me.contentFillColor.imageContent);
    } else if (me.contentTexture.isCurrent) {
      // Copy texture to the WebGL canvas
      me.allocateContentCanvas();
      const glCanvas = me.parentObject.getWebGLCanvas();
      glCanvas.copyFrom(me.contentTexture.imageContent);

      // Copy the WebGL canvas to a 2D canvas
      await me.contentCanvas.imageContent.copyFromAsync(glCanvas);
    } else {
      FimError.throwOnImageUninitialized(me.handle);
    }

    me.markCurrent(me.contentCanvas, false);
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
    } else if (me.contentCanvas.isCurrent) {
      // Copy canvas to texture
      me.allocateContentTexture();
      await me.contentTexture.imageContent.copyFromAsync(me.contentCanvas.imageContent);
    } else {
      FimError.throwOnImageUninitialized(me.handle);
    }

    me.markCurrent(me.contentTexture, false);
    return me.contentTexture.imageContent;
  }

  /** Releases any resources used by `contentCanvas.imageContent` */
  private releaseContentCanvas(): void {
    const me = this;
    const canvas = me.contentCanvas;

    if (canvas.imageContent) {
      canvas.imageContent.dispose();
      canvas.imageContent = undefined;
      canvas.isCurrent = false;

      // Recalculate hasImageValue
      me.hasImageValue = me.contentFillColor.isCurrent || me.contentTexture.isCurrent;
    }
  }

  /** Releases any resources used by `contentTexture.imageContent` */
  private releaseContentTexture(): void {
    const me = this;
    const texture = me.contentTexture;

    if (texture.imageContent) {
      texture.imageContent.dispose();
      texture.imageContent = undefined;
      texture.isCurrent = false;

      // Recalculate hasImageValue
      me.hasImageValue = me.contentFillColor.isCurrent || me.contentCanvas.isCurrent;
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

      // Handle the image option to fill the image with a solid color if we lost the image contents
      if (!me.hasImageValue) {
        const imageOptions = me.getImageOptions();
        if (imageOptions.fillColorOnContextLost) {
          me.contentFillColor.imageContent = imageOptions.fillColorOnContextLost;
          me.markCurrent(me.contentFillColor, true);
        }
      }
    }
  }

  public async fillSolidAsync(color: FimColor | string): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // Force color to be a FimColor
    color = (typeof(color) !== 'string') ? color : FimColor.fromString(color);

    me.contentFillColor.imageContent = color;
    me.markCurrent(me.contentFillColor, true);

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

    me.allocateContentCanvas();
    await me.contentCanvas.imageContent.loadPixelDataAsync(pixelData, dimensions);
    me.markCurrent(me.contentCanvas, true);

    // TODO: release resources based on optimization settings
  }

  public async loadFromPngAsync(pngFile: Uint8Array, allowRescale = false): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    me.allocateContentCanvas();
    await me.contentCanvas.imageContent.loadFromPngAsync(pngFile, allowRescale);
    me.markCurrent(me.contentCanvas, true);

    // TODO: release resources based on optimization settings
  }

  public async loadFromJpegAsync(jpegFile: Uint8Array, allowRescale = false): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    me.allocateContentCanvas();
    await me.contentCanvas.imageContent.loadFromJpegAsync(jpegFile, allowRescale);
    me.markCurrent(me.contentCanvas, true);

    // TODO: release resources based on optimization settings
  }

  public async copyFromAsync(srcImage: EngineImage, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // copyFrom(self) is a no-op. It's not an error, but display a warning if debugging as it most likely wasn't the
    // desired behavior.
    if (srcImage === this) {
      if (me.getEngineOptions().showWarnings) {
        me.parentObject.writeWarning(me, 'copyFrom(self) may be an error');
      }
      return;
    }

    // Ensure srcImage belongs to the same EngineFim instance
    if (me.parentObject !== srcImage.parentObject) {
      throw new FimError(FimErrorCode.InvalidParameter, `${srcImage.handle} copyFrom wrong FIM`);
    }

    await srcImage.populateContentCanvas();
    me.allocateContentCanvas();
    await me.contentCanvas.imageContent.copyFromAsync(srcImage.contentCanvas.imageContent, srcCoords, destCoords);
    me.markCurrent(me.contentCanvas, true);

    // TODO: release resources based on optimization settings
  }

  public async executeAsync(shaderOrOperation: EngineShader | FimOperation, destCoords?: FimRect): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // Ensure shader belongs to the same EngineFim instance
    if (me.parentObject !== shaderOrOperation.parentObject) {
      throw new FimError(FimErrorCode.InvalidParameter, `${shaderOrOperation.handle} execute on wrong FIM`);
    }

    // Handle operations separately from shaders
    if (shaderOrOperation instanceof FimOperation) {
      return shaderOrOperation.executeAsync(me, destCoords);
    }

    if (shaderOrOperation.uniformsContainEngineImage(me)) {
      // Special case: We are using this image both as an input and and output. Using a single texture as both input and
      // output isn't supported by WebGL, but we work around this by creating a temporary WebGL texture.
      const glCanvas = me.parentObject.getWebGLCanvas();
      const outputTexture = glCanvas.createCoreTexture(me.getTextureOptions(), me.imageDimensions);
      try {
        await shaderOrOperation.executeAsync(outputTexture, destCoords);
      } catch (err) {
        outputTexture.dispose();
        throw err;
      }
      me.releaseContentTexture();
      me.contentTexture.imageContent = outputTexture;
    } else {
      // Normal case: we can write to the normal WebGL texture as it is not an input to the shader.
      me.allocateContentTexture();
      await shaderOrOperation.executeAsync(me.contentTexture.imageContent, destCoords);
    }
    me.markCurrent(me.contentTexture, true);

    // If the backup image option is set, immediately back up the texture to a 2D canvas in case the WebGL context gets
    // lost.
    if (me.getImageOptions().backup) {
      await me.populateContentCanvas();
    }

    // TODO: release resources based on optimization settings
  }

  public async exportToPixelDataAsync(srcCoords?: FimRect): Promise<Uint8ClampedArray> {
    const me = this;
    me.ensureNotDisposed();
    await me.populateContentCanvas();
    const pixelData = await me.contentCanvas.imageContent.exportToPixelData(srcCoords);

    // TODO: release resources based on optimization settings

    return pixelData;
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
