// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineImage } from './EngineImage';
import { ImageType } from './optimizer/ImageType';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasOptions } from '../core/CoreCanvasOptions';
import { CoreTexture } from '../core/CoreTexture';
import { CoreTextureOptions } from '../core/CoreTextureOptions';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';

/**
 * Base class for any object containing the image contents
 * @template TContent Class containing the image contents
 */
export class ImageContent<TContent> {
  /** Object containing the image content. May be undefined if unallocated. */
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
   * @param imageCollection Parent `ImageCollection`
   * @param imageType Type enum
   * @param name Object name used to create a unique handle
   */
  public constructor(protected readonly imageCollection: ImageCollection, protected readonly imageType: ImageType,
      name: string) {
    super();
    this.handle = `${imageCollection.parentImage.handle}/${name}`;
  }

  /** Unique string identifying the object */
  public readonly handle: string;

  /** Returns the options for creating a new `TContent` instance */
  public abstract getOptions(): TOptions;

  /**
   * Calculates the dimensions and dowbscale factor for a 2D canvas or WebGL texture
   * @param dimensions Requested dimensions or downscale ratio of the canvas. This value is used to support the
   *    `imageOptions.preserveDownscaledDimensions` optimization and is ignored if this optimization is disabled.
   * @returns Object containing the downscaled dimensions and downscale factor
   */
  public calculateDimensionsAndDownscale(dimensions?: FimDimensions): DimensionsAndDownscale {
    const me = this;
    const imageCollection = me.imageCollection;
    const parentImage = imageCollection.parentImage;
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
    const maxGLSize = options.glReadOnly ? caps.glMaxTextureSize : caps.glMaxRenderBufferSize;
    const maxDim = Math.max(dim.w, dim.h);
    downscaleValues.push(maxGLSize / maxDim);

    // Check whether the image dimensions are larger than enabled by the engine options
    const engineOptions = parentImage.getEngineOptions();
    const maxOptionsSize = options.glReadOnly ? engineOptions.maxGLTextureSize : engineOptions.maxGLRenderBufferSize;
    downscaleValues.push(maxOptionsSize / maxDim);

    // Check whether the image dimensions are larger than the parent FIM instance
    if (!options.allowOversized && (dim.w > root.maxImageDimensions.w || dim.h > root.maxImageDimensions.h)) {
      downscaleValues.push(root.maxImageDimensions.w / dim.w);
      downscaleValues.push(root.maxImageDimensions.h / dim.h);

      // Log a warning when this happens. It is likely a bug in the calling code if the requested FimImage dimensions
      // are larger than Fim.maxImageDimensions. If the caller truly wants this, they should consider setting
      // FimImageOptions.allowOversized to prevent it from getting automatically downscaled.
      if (!me.imageCollection.autoDownscaleWarningLogged) {
        root.writeWarning(parentImage, `Auto-downscale ${me.handle}: ${dim} > max (${root.maxImageDimensions})`);
        me.imageCollection.autoDownscaleWarningLogged = true;
      }
    }

    // Calculate the scale factor and new dimensions
    const downscale = Math.min(...downscaleValues);
    const scaledDimensions = dim.rescale(downscale).toFloor();
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
   * @returns `this.imageContent`
   */
  public allocateContent(dimensions?: FimDimensions): TContent {
    const me = this;
    const parentImage = me.imageCollection.parentImage;
    const root = parentImage.rootObject;
    const optimizer = root.optimizer;

    // Calculate the desired dimensions and downscale ratio
    const dd = me.calculateDimensionsAndDownscale(dimensions);

    // If a canvas or texture is already allocated and of the correct size, this function is a no-op
    // TODO: Detect changes in the imageOptions that could also cause the texture to be reallocated
    if (me.imageContent) {
      if (me.downscale === dd.downscale) {
        optimizer.recordImageWrite(parentImage, me.imageType);
        return me.imageContent;
      } else {
        // The canvas or texture is allocated but of the wrong size. Release the current one and reallocate it.
        me.releaseContent();
      }
    }

    // Create the underlying canvas or texture
    const options = me.getOptions();
    const content = me.imageContent = me.allocateContentInternal(dd.scaledDimensions, options);
    me.downscale = dd.downscale;

    // Record the object creation
    root.resources.recordCreate(parentImage, content);

    optimizer.recordImageWrite(parentImage, me.imageType);
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
   */
  public async populateContentAsync(): Promise<TContent> {
    const me = this;
    const imageCollection = me.imageCollection;
    const parentImage = imageCollection.parentImage;
    const optimizer = parentImage.rootObject.optimizer;

    if (!imageCollection.hasImage()) {
      FimError.throwOnImageUninitialized(parentImage.handle);
    } else if (me.isCurrent) {
      // If a canvas is already current, this function is a no-op
    } else {
      await me.populateContentInternalAsync();
      imageCollection.markCurrent(this, false);
      optimizer.recordImageWrite(parentImage, me.imageType);
    }

    optimizer.recordImageRead(parentImage, me.imageType);
    return me.imageContent;
  }

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
   * @param dimensions Requested dimensions of the canvas or texture. This value is used to support the
   *    `imageOptions.preserveDownscaledDimensions` optimization and is ignored if this optimization is disabled.
   */
  public async allocateOrPopulateContentAsync(destCoords: FimRect, dimensions?: FimDimensions): Promise<TContent> {
    const me = this;
    const parentImage = me.imageCollection.parentImage;
    const optimizer = parentImage.rootObject.optimizer;

    if (destCoords.dim.equals(me.imageCollection.parentImage.dim)) {
      // The destination is the full image. The current image contents will be erased, so use the opportunity to update
      // the image options or use a smaller canvas than is actually needed (the preserveDownscaledDimensions
      // optimization).
      me.allocateContent(dimensions);
    } else {
      // The destination is not the full image. Some of the current image is required. Ensure the canvas is populated,
      // and throw an exception if the current image is uninitialized.
      await me.populateContentAsync();

      // populateContentAsync() is normally called before read operations. We have to explicitly record the write here.
      optimizer.recordImageWrite(parentImage, me.imageType);
    }

    return me.imageContent;
  }

  /** Releases any resources used by `imageContent` */
  public releaseContent(): void {
    const me = this;
    const parentImage = me.imageCollection.parentImage;
    const resources = parentImage.rootObject.resources;

    if (me.imageContent) {
      // Record the object disposal
      resources.recordDispose(parentImage, me.imageContent);

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
   * @param imageCollection Parent `ImageCollection`
   */
  public constructor(imageCollection: ImageCollection) {
    super(imageCollection, ImageType.Canvas, 'ContentCanvas');
  }

  public getOptions(): CoreCanvasOptions {
    //const options = this.imageCollection.parentImage.getImageOptions();
    return {};
  }

  protected allocateContentInternal(dimensions: FimDimensions, options: CoreCanvasOptions): CoreCanvas2D {
    const root = this.imageCollection.parentImage.rootObject;
    root.optimizer.reserveCanvasMemory(dimensions.getArea() * 4);
    return root.createCoreCanvas2D(options, dimensions, this.handle);
  }

  protected async populateContentInternalAsync(): Promise<void> {
    const me = this;
    const imageCollection = me.imageCollection;
    const parentImage = imageCollection.parentImage;
    const root = parentImage.rootObject;
    const optimizer = root.optimizer;

    if (imageCollection.contentFillColor.isCurrent) {
      // Copy the fill color to the canvas to make it current
      me.allocateContent().fillSolid(imageCollection.contentFillColor.imageContent);
    } else if (imageCollection.contentTexture.isCurrent) {
      // First, get the WebGL canvas. The getWebGLCanvas() call will allocate or resize it if necessary.
      const srcTexture = imageCollection.contentTexture.imageContent;
      const glCanvas = root.getWebGLCanvas();

      // Calculate the coordinates to use on the WebGL canvas
      const glCanvasDim = srcTexture.dim.fitInside(glCanvas.dim).toFloor();
      const glCanvasCoords = FimRect.fromDimensions(glCanvasDim);

      // Copy texture to the WebGL canvas
      glCanvas.copyFrom(srcTexture, undefined, glCanvasCoords);

      // Copy the WebGL canvas to a 2D canvas
      await me.allocateContent(glCanvasDim).copyFromAsync(glCanvas, glCanvasCoords);

      optimizer.recordImageRead(parentImage, ImageType.Texture);
    }

    optimizer.recordImageWrite(parentImage, ImageType.Canvas);
  }
}

/** Implementation of `ImageContent` for `CoreTexture` */
export class TextureImageContent extends ImageContentCommon<CoreTexture, CoreTextureOptions> {
  /**
   * Constructor
   * @param imageCollection Parent `ImageCollection`
   */
  public constructor(imageCollection: ImageCollection) {
    super(imageCollection, ImageType.Texture, 'ContentTexture');
  }

  public getOptions(): CoreTextureOptions {
    const options = this.imageCollection.parentImage.getImageOptions();
    return {
      bpp: options.bpp,
      isReadOnly: options.glReadOnly,
      sampling: options.sampling
    };
  }

  public calculateDimensionsAndDownscale(dimensions?: FimDimensions): DimensionsAndDownscale {
    // Run the standard calculation for downscale
    let dd = super.calculateDimensionsAndDownscale(dimensions);

    // For WebGL textures, also consider the glDownscale parameter in the image options. If it results in smaller
    // dimensions, override the result with the lower values.
    const parentImage = this.imageCollection.parentImage;
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
    const root = me.imageCollection.parentImage.rootObject;
    const glCanvas = root.getWebGLCanvas();
    root.optimizer.reserveGLMemory(dimensions.getArea() * options.bpp * 0.5);
    return glCanvas.createCoreTexture(options, dimensions, me.handle);
  }

  protected async populateContentInternalAsync(): Promise<void> {
    const me = this;
    const imageCollection = me.imageCollection;
    const parentImage = imageCollection.parentImage;
    const root = parentImage.rootObject;
    const optimizer = root.optimizer;

    if (imageCollection.contentFillColor.isCurrent) {
      // Fill texture with solid color
      me.allocateContent().fillSolid(imageCollection.contentFillColor.imageContent);
    } else if (imageCollection.contentCanvas.isCurrent) {
      // Copy canvas to texture
      const srcImage = imageCollection.contentCanvas.imageContent;
      await me.allocateContent(srcImage.dim).copyFromAsync(srcImage);
      optimizer.recordImageRead(parentImage, ImageType.Canvas);
    }

    optimizer.recordImageWrite(parentImage, ImageType.Texture);
  }
}

/** Collection of representations of the same image, used by `EngineImage` to store its data */
export class ImageCollection {
  /**
   * Constructor
   * @param parentImage Parent `EngineImage` instance
   */
  public constructor(public readonly parentImage: EngineImage) {
  }

  /** Contains the color of the image if the contents are a solid color */
  public readonly contentFillColor = new ImageContent<FimColor>();

  /** Contains the contents of the image as a 2D canvas */
  public readonly contentCanvas = new CanvasImageContent(this);

  /** Contains the contents of the image as a WebGL texture */
  public readonly contentTexture = new TextureImageContent(this);

  /** Returns `true` if any of the image representations have `isCurrent === true` */
  public hasImage(): boolean {
    return this.contentFillColor.isCurrent || this.contentCanvas.isCurrent || this.contentTexture.isCurrent;
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
}

/** Return value from `ImageContentCommon.calculateDimensionsAndDownscale()` */
export interface DimensionsAndDownscale {
  /** Dimensions downscaled by `downscale` */
  scaledDimensions: FimDimensions;

  /** Downscale ratio */
  downscale: number;
}
