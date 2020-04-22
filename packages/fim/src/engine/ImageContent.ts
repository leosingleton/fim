// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageFormat } from './optimizer/ImageFormat';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasOptions } from '../core/CoreCanvasOptions';
import { CoreTexture } from '../core/CoreTexture';
import { CoreTextureOptions } from '../core/CoreTextureOptions';
import { EngineImage } from '../engine/EngineImage';
import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';
import { OperationType } from './optimizer/OperationType';
import { deepEquals } from '@leosingleton/commonlibs';

/**
 * Base class for any object containing the image contents
 * @template TContent Class containing the image contents
 */
export class ImageContent<TContent> {
  /** Object containing the image content. May be `undefined` if unallocated. */
  public imageContent?: TContent;

  /** True if `imageContent` contains the latest image. False if it is out-of-date. */
  public isCurrent = false;

  /**
   * Downscale factor which can be passed to `FimGeometry.rescale()` to convert coordinates from the `EngineImage`'s
   * virtual dimensions to the actual dimensions of the underlying `imageContent` object
   */
  public downscale = 1;
}

/**
 * Base class for textures and canvases containing the image contents
 * @template TContent Texture or canvas class containing the image contents
 * @template TOptions Options class used to construct `TContent`
 */
export abstract class ImageContentCommon<TContent extends CoreTexture | CoreCanvas2D, TOptions>
    extends ImageContent<TContent> {
  /**
   * Constructor
   * @param parentImage Parent `EngineImage` instance
   * @param name Object name used to create a unique handle
   */
  public constructor(protected readonly parentImage: EngineImage, name: string) {
    super();
    this.handle = `${parentImage.handle}/${name}`;
  }

  /** Unique string identifying the object */
  public readonly handle: string;

  /**
   * Return the options of the current `imageContent` instance. Returns `undefined` if `imageContent` is also
   * `undefined`.
   */
  public abstract getCurrentOptions(): TOptions;

  /**
   * Returns the options for creating a new `TContent` instance
   * @param glWritable Set to `true` if the `imageContent` is to be used as the target of a WebGL shader. Ignored for
   *    any non-WebGL texture implementations.
   */
  public abstract getDesiredOptions(glWritable: boolean): TOptions;

  /**
   * Calculates the dimensions and dowbscale factor for a 2D canvas or WebGL texture
   * @param dimensions Requested dimensions or downscale ratio of the canvas. This value is used to support the
   *    `imageOptions.preserveDownscaledDimensions` optimization and is ignored if this optimization is disabled.
   * @returns Object containing the downscaled dimensions and downscale factor
   */
  public calculateDimensionsAndDownscale(dimensions?: FimDimensions): DimensionsAndDownscale {
    const me = this;
    const parentImage = me.parentImage;
    const dim = parentImage.dim;
    const options = parentImage.getImageOptions();
    const root = parentImage.rootObject;
    const caps = root.capabilities;

    // We build an array of downscale values. The minimum one wins.
    const downscaleValues = [options.downscale];

    // Support the preserveDownscaledDimensions optimization
    if (dimensions && options.preserveDownscaledDimensions && dimensions.equalsAspectRatio(dim)) {
      downscaleValues.push(FimDimensions.calculateDownscaleRatio(dim, dimensions));
    }

    // Check whether the image dimensions are larger than supported by WebGL
    const maxGLSize = options.oversizedReadOnly ? caps.glMaxTextureSize : caps.glMaxRenderBufferSize;
    const maxDim = Math.max(dim.w, dim.h);
    downscaleValues.push(maxGLSize / maxDim);

    // Check whether the image dimensions are larger than enabled by the engine options
    const engineOptions = parentImage.getEngineOptions();
    const maxOptionsSize = options.oversizedReadOnly ? engineOptions.maxGLTextureSize :
      engineOptions.maxGLRenderBufferSize;
    downscaleValues.push(maxOptionsSize / maxDim);

    // Check whether the image dimensions are larger than the parent FIM instance
    if (dim.w > engineOptions.maxImageDimensions.w || dim.h > engineOptions.maxImageDimensions.h) {
      downscaleValues.push(engineOptions.maxImageDimensions.w / dim.w);
      downscaleValues.push(engineOptions.maxImageDimensions.h / dim.h);
    }

    // Calculate the downscale factor and new dimensions
    const downscale = Math.min(...downscaleValues);
    const scaledDimensions = dim.rescale(downscale).toFloor();

    // Log a warning whenever an auto-downscale happens
    if (downscale < options.downscale && !parentImage.autoDownscaleWarningLogged) {
      root.writeWarning(parentImage,
        `Auto-downscale ${me.handle}: ${options.downscale} => ${downscale} (${scaledDimensions})`);
      parentImage.autoDownscaleWarningLogged = true;
    }

    return { downscale, scaledDimensions };
  }

  /**
   * Allocates or reallocates `imageContent`. This function should be called before writing to `imageContent` with an
   * operation that fully erases the previous image contents.
   *
   * Note that this call is NOT GUARANTEED to preserve the contents of the canvas if it is already allocated. It may
   * choose to reuse the existing canvas, in which case it is dirty with the previous contents, or it may choose to
   * allocate a new canvas, whichever is more efficient.
   *
   * @param dimensions Requested dimensions of the canvas or texture. This value is used to support the
   *    `imageOptions.preserveDownscaledDimensions` optimization and is ignored if this optimization is disabled.
   * @param glWritable Defaults to `false`. Must be set to `true` if the `imageContent` is to be used as the target of
   *    a WebGL shader. Ignored for any non-WebGL texture implementations.
   * @returns `this.imageContent`
   */
  public allocateContent(dimensions?: FimDimensions, glWritable = false): TContent {
    const me = this;
    const parentImage = me.parentImage;
    const root = parentImage.rootObject;

    // Calculate the desired dimensions, downscale ratio, and image options
    const dd = me.calculateDimensionsAndDownscale(dimensions);
    const desiredOptions = me.getDesiredOptions(glWritable);

    // If a canvas or texture is already allocated and of the correct size and options, this function is a no-op
    const currentOptions = me.getCurrentOptions();
    if (me.imageContent) {
      if (me.downscale === dd.downscale && deepEquals(currentOptions, desiredOptions)) {
        return me.imageContent;
      } else {
        // The canvas or texture is allocated but of the wrong size. Release the current one and reallocate it.
        me.releaseContent();
      }
    }

    // Create the underlying canvas or texture
    const content = me.imageContent = me.allocateContentInternal(dd.scaledDimensions, desiredOptions);
    me.downscale = dd.downscale;

    // Record the object creation
    root.resources.recordCreate(parentImage, content);

    return content;
  }

  /**
   * Derived classes must implement this method to allocate a `TContent` object
   * @param dimensions Dimensions of the object to allocate
   * @param options Object creation options
   * @returns New `TContent`
   */
  protected abstract allocateContentInternal(dimensions: FimDimensions, options: TOptions): TContent;

  /**
   * Ensures `imageContent` is current and contains the current image data. This function should be called before
   * reading from `imageContent`.
   * @param glWritable Defaults to `false`. Must be set to `true` if the `imageContent` is to be used as the target of
   *    a WebGL shader. Ignored for any non-WebGL texture implementations.
   */
  public async populateContentAsync(glWritable = false): Promise<TContent> {
    const me = this;
    const parentImage = me.parentImage;

    if (!parentImage.hasImage()) {
      const defaultFillColor = parentImage.getImageOptions().defaultFillColor;
      if (defaultFillColor) {
        // Handle the image option to fill the image with a solid color whenever we have no image contents
        parentImage.contentFillColor.imageContent = FimColor.fromColorOrString(defaultFillColor);
        parentImage.markCurrent(parentImage.contentFillColor, true);
      } else {
        FimError.throwOnImageUninitialized(parentImage.handle);
      }
    }

    if (me.isCurrent) {
      // imageContent is already current. This function call is a no-op, unless the image options have changed.
      const currentOptions = me.getCurrentOptions();
      const desiredOptions = me.getDesiredOptions(glWritable);

      if (!deepEquals(currentOptions, desiredOptions)) {
        // Reallocate the image content with different options. Copy the previous image to the new image.
        const newContent = await me.allocateContentInternal(me.imageContent.dim, desiredOptions);
        try {
          await this.copyContentInternalAsync(newContent, me.imageContent);
          me.imageContent.dispose();
          me.imageContent = newContent;
        } catch (err) {
          newContent.dispose();
          throw err;
        }
      }
    } else {
      await me.populateContentInternalAsync();
      parentImage.markCurrent(this, false);
    }

    return me.imageContent;
  }

  /**
   * Derived classes must implement this method to copy `srcContent` to `destContent`. The implementation may assume
   * that the two objects have the same dimensions, however they may have different image options.
   * @param destContent Destination image content
   * @param srcContent Source image content
   */
  protected abstract copyContentInternalAsync(destContent: TContent, srcContent: TContent): Promise<void>;

  /**
   * Derived classes must implement this method to populate `imageContent` with the current image data from another
   * `ImageContent` instance
   */
  protected abstract populateContentInternalAsync(): Promise<void>;

  /**
   * This function should be called before writing to `imageContent`. It calls either `allocateContent()` or
   * `populateContentAsync()` depending on whether the destination coordinates of the operation will fully erase the
   * previous image contents
   * @param destCoords Destination coordinates of the write operation
   * @param forcePopulate If `true`, we assume the operation will not fully erase the previous image contents and thus
   *    always call `populateContentAsync()`
   * @param dimensions Requested dimensions of the canvas or texture. This value is used to support the
   *    `imageOptions.preserveDownscaledDimensions` optimization and is ignored if this optimization is disabled.
   * @param glWritable Defaults to `false`. Must be set to `true` if the `imageContent` is to be used as the target of
   *    a WebGL shader. Ignored for any non-WebGL texture implementations.
   */
  public async allocateOrPopulateContentAsync(destCoords: FimRect, forcePopulate = false, dimensions?: FimDimensions,
      glWritable = false): Promise<TContent> {
    const me = this;
    const parentImage = me.parentImage;

    if (!forcePopulate && destCoords.dim.equals(parentImage.dim)) {
      // The destination is the full image. The current image contents will be erased, so use the opportunity to update
      // the image options or use a smaller canvas than is actually needed (the preserveDownscaledDimensions
      // optimization).
      me.allocateContent(dimensions, glWritable);
    } else {
      // The destination is not the full image. Some of the current image is required. Ensure the canvas is populated,
      // and throw an exception if the current image is uninitialized.
      await me.populateContentAsync(glWritable);
    }

    return me.imageContent;
  }

  /** Releases any resources used by `imageContent` */
  public releaseContent(): void {
    const me = this;
    const resources = me.parentImage.rootObject.resources;

    if (me.imageContent) {
      // Record the object disposal
      resources.recordDispose(me.parentImage, me.imageContent);

      me.imageContent.dispose();
      me.imageContent = undefined;
      me.isCurrent = false;
    }
  }
}

/** Implementation of `ImageContent` for `CoreCanvas2D` */
export class CanvasImageContent extends ImageContentCommon<CoreCanvas2D, CoreCanvasOptions> {
  /**
   * Constructor
   * @param parentImage Parent `EngineImage` instance
   */
  public constructor(parentImage: EngineImage) {
    super(parentImage, 'ContentCanvas');
  }

  public getCurrentOptions(): CoreCanvasOptions {
    return this.imageContent?.canvasOptions;
  }

  public getDesiredOptions(_glWritable: boolean): CoreCanvasOptions {
    //const options = this.imageCollection.parentImage.getImageOptions();
    return {};
  }

  protected allocateContentInternal(dimensions: FimDimensions, options: CoreCanvasOptions): CoreCanvas2D {
    const root = this.parentImage.rootObject;
    root.optimizer.reserveCanvasMemory(dimensions.getArea() * 4);
    return root.createCoreCanvas2D(dimensions, options, this.handle);
  }

  protected copyContentInternalAsync(destContent: CoreCanvas2D, srcContent: CoreCanvas2D): Promise<void> {
    return destContent.copyFromAsync(srcContent);
  }

  protected async populateContentInternalAsync(): Promise<void> {
    const me = this;
    const parentImage = me.parentImage;
    const root = parentImage.rootObject;
    const optimizer = root.optimizer;
    const contentFillColor = parentImage.contentFillColor;
    const contentTexture = parentImage.contentTexture;

    if (contentFillColor.isCurrent) {
      // Copy the fill color to the canvas to make it current
      me.allocateContent().fillSolid(contentFillColor.imageContent);
    } else if (contentTexture.isCurrent) {
      // First, get the WebGL canvas. The getWebGLCanvas() call will allocate or resize it if necessary.
      const srcTexture = contentTexture.imageContent;
      const glCanvas = root.getWebGLCanvas();

      // Calculate the coordinates to use on the WebGL canvas
      const glCanvasDim = srcTexture.dim.fitInside(glCanvas.dim).toFloor();
      const glCanvasCoords = FimRect.fromDimensions(glCanvasDim);

      // Copy texture to the WebGL canvas
      glCanvas.copyFrom(srcTexture, undefined, glCanvasCoords);

      // Copy the WebGL canvas to a 2D canvas
      await me.allocateContent(glCanvasDim).copyFromAsync(glCanvas, glCanvasCoords);

      optimizer.recordImageRead(parentImage, ImageFormat.Texture, OperationType.InternalConversion);
    }

    optimizer.recordImageWrite(parentImage, ImageFormat.Canvas, OperationType.InternalConversion);
  }
}

/** Implementation of `ImageContent` for `CoreTexture` */
export class TextureImageContent extends ImageContentCommon<CoreTexture, CoreTextureOptions> {
  /**
   * Constructor
   * @param parentImage Parent `EngineImage` instance
   */
  public constructor(parentImage: EngineImage) {
    super(parentImage, 'ContentTexture');
  }

  public getCurrentOptions(): CoreTextureOptions {
    return this.imageContent?.textureOptions;
  }

  public getDesiredOptions(glWritable: boolean): CoreTextureOptions {
    const options = this.parentImage.getImageOptions();
    return {
      // The only image source that supports higher than 8 BPP are WebGL shaders. So unless the texture is going to be
      // used to store the output of a WebGL shader, force the color depth to 8 BPP.
      bpp: glWritable ? options.bpp : FimBitsPerPixel.BPP8,
      isReadOnly: !glWritable || options.oversizedReadOnly,
      sampling: options.sampling
    };
  }

  public calculateDimensionsAndDownscale(dimensions?: FimDimensions): DimensionsAndDownscale {
    // Run the standard calculation for downscale
    let dd = super.calculateDimensionsAndDownscale(dimensions);

    // For WebGL textures, also consider the glDownscale parameter in the image options. If it results in smaller
    // dimensions, override the result with the lower values.
    const parentImage = this.parentImage;
    const glDownscale = parentImage.getImageOptions().glDownscale;
    if (glDownscale < dd.downscale) {
      dd = {
        downscale: glDownscale,
        scaledDimensions: parentImage.dim.rescale(glDownscale)
      };
    }

    return dd;
  }

  protected allocateContentInternal(dimensions: FimDimensions, options: CoreTextureOptions): CoreTexture {
    const me = this;
    const root = me.parentImage.rootObject;
    const glCanvas = root.getWebGLCanvas();
    root.optimizer.reserveGLMemory(dimensions.getArea() * options.bpp * 0.5);
    return glCanvas.createCoreTexture(dimensions, options, me.handle);
  }

  public populateContentAsync(glWritable = false): Promise<CoreTexture> {
    // We overload this method with a special case just for textures: If the texture is already allocated and writable,
    // don't reallocate the texture to make it read-only.
    if (!glWritable && this.imageContent) {
      glWritable = !this.imageContent.textureOptions.isReadOnly;
    }

    return super.populateContentAsync(glWritable);
  }

  protected async copyContentInternalAsync(destContent: CoreTexture, srcContent: CoreTexture): Promise<void> {
    return destContent.copyFromTexture(srcContent);
  }

  protected async populateContentInternalAsync(): Promise<void> {
    const me = this;
    const parentImage = me.parentImage;
    const root = parentImage.rootObject;
    const optimizer = root.optimizer;
    const contentFillColor = parentImage.contentFillColor;
    const contentCanvas = parentImage.contentCanvas;

    if (contentFillColor.isCurrent) {
      // Fill texture with solid color
      me.allocateContent(undefined, true).fillSolid(contentFillColor.imageContent);
    } else if (contentCanvas.isCurrent) {
      // Copy canvas to texture
      const srcImage = contentCanvas.imageContent;
      await me.allocateContent(srcImage.dim).copyFromAsync(srcImage);
      optimizer.recordImageRead(parentImage, ImageFormat.Canvas, OperationType.InternalConversion);
    }

    optimizer.recordImageWrite(parentImage, ImageFormat.Texture, OperationType.InternalConversion);
  }
}

/** Return value from `ImageContentCommon.calculateDimensionsAndDownscale()` */
export interface DimensionsAndDownscale {
  /** Dimensions downscaled by `downscale` */
  scaledDimensions: FimDimensions;

  /** Downscale ratio */
  downscale: number;
}
