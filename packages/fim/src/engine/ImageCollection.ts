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

/** Wrapper around textures and canvases containing the image content */
export abstract class ImageContent<TContent, TOptions> {
  /**
   * Constructor
   * @param imageCollection Parent `ImageCollection`
   */
  public constructor(protected readonly imageCollection: ImageCollection) {
  }

  /** Texture or canvas containing the image content. May be undefined if unallocated. */
  public imageContent?: TContent;

  /** True if `imageContent` contains the latest image. False if it is out-of-date. */
  public isCurrent = false;

  /**
   * Downscale factor which can be passed to `FimGeometry.rescale()` to convert coordinates from the `EngineImage`'s
   * virtual dimensions to the actual dimensions of the underlying `imageContent` object
   */
  public downscale = 1;

  /** Calculates the options for creating a new `imageContent` instance */
  public abstract getOptions(): TOptions;
}

/** Implementation of `ImageContent` for `FimColor` */
export class ColorImageContent extends ImageContent<FimColor, never> {
  public getOptions(): never {
    FimError.throwOnUnreachableCode();
  }
}

/** Implementation of `ImageContent` for `CoreCanvas2D` */
export class CanvasImageContent extends ImageContent<CoreCanvas2D, CoreCanvasOptions> {
  public getOptions(): CoreCanvasOptions {
    //const options = this.imageCollection.parentImage.getImageOptions();
    return {};
  }
}

/** Implementation of `ImageContent` for `CoreTexture` */
export class TextureImageContent extends ImageContent<CoreTexture, CoreTextureOptions> {
  public getOptions(): CoreTextureOptions {
    const options = this.imageCollection.parentImage.getImageOptions();
    return {
      bpp: options.bpp,
      isReadOnly: options.glReadOnly,
      sampling: options.sampling
    };
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
  public readonly contentFillColor = new ColorImageContent(this);

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
  public markCurrent<TContent, TOptions>(ic: ImageContent<TContent, TOptions>, invalidateOthers: boolean): void {
    const me = this;

    if (invalidateOthers) {
      me.contentFillColor.isCurrent = false;
      me.contentCanvas.isCurrent = false;
      me.contentTexture.isCurrent = false;
    }

    ic.isCurrent = true;
  }

  /**
   * Ensures `contentCanvas.imageContent` points to a valid 2D canvas
   *
   * Note that this call is NOT GUARANTEED to preserve the contents of the canvas if it is already allocated. It may
   * choose to reuse the existing canvas, in which case it is dirty with the previous contents, or it may choose to
   * allocate a new canvas, whichever is more efficient.
   *
   * @param dimensions Requested dimensions or downscale ratio of the canvas. This value is used to support the
   *    `imageOptions.preserveDownscaledDimensions` optimization and is ignored if this optimization is disabled.
   */
  public allocateContentCanvas(dimensions?: FimDimensions): void {
    const me = this;
    const parentImage = me.parentImage;
    const root = parentImage.rootObject;
    const handle = `${parentImage.handle}/ContentCanvas`;

    // Calculate the desired dimensions
    const dsf = me.calculateDimensionsAndScaleFactor(handle, false, dimensions);

    // If a canvas is already allocated and of the correct size, this function is a no-op
    if (me.contentCanvas.imageContent) {
      if (me.contentCanvas.downscale === dsf.downscale) {
        return;
      } else {
        // The canvas is allocated but of the wrong size. Release the current one and reallocate it.
        me.releaseContentCanvas();
      }
    }

    // Create a 2D canvas
    const options = me.contentCanvas.getOptions();
    root.optimizer.reserveCanvasMemory(dsf.scaledDimensions.getArea() * 4);
    const canvas = me.contentCanvas.imageContent = root.createCoreCanvas2D(options, dsf.scaledDimensions, handle);
    me.contentCanvas.downscale = dsf.downscale;

    // Record the canvas creation
    root.resources.recordCreate(parentImage, canvas);
  }

  /**
   * Ensures `contentTexture.imageContent` points to a valid WebGL texture
   *
   * Note that this call is NOT GUARANTEED to preserve the contents of the texture if it is already allocated. It may
   * choose to reuse the existing texture, in which case it is dirty with the previous contents, or it may choose to
   * allocate a new texture, whichever is more efficient.
   *
   * @param dimensions Requested dimensions of the canvas. This value is used to support the
   *    `imageOptions.preserveDownscaledDimensions` optimization and is ignored if this optimization is disabled.
   */
  public allocateContentTexture(dimensions?: FimDimensions): void {
    const me = this;
    const parentImage = me.parentImage;
    const root = parentImage.rootObject;
    const handle = `${parentImage.handle}/ContentTexture`;

    // Calculate the desired dimensions
    const dsf = me.calculateDimensionsAndScaleFactor(handle, true, dimensions);

    // If a texture is already allocated and of the correct size, this function is a no-op
    // TODO: Detect changes in the imageOptions that could also cause the texture to be reallocated
    if (me.contentTexture.imageContent) {
      if (me.contentTexture.downscale === dsf.downscale) {
        return;
      } else {
        // The canvas is allocated but of the wrong size. Release the current one and reallocate it.
        me.releaseContentTexture();
      }
    }

    // Create a WebGL texture
    const glCanvas = root.getWebGLCanvas();
    const options = me.contentTexture.getOptions();
    root.optimizer.reserveGLMemory(dsf.scaledDimensions.getArea() * options.bpp * 0.5);
    const texture = me.contentTexture.imageContent = glCanvas.createCoreTexture(options, dsf.scaledDimensions, handle);
    me.contentTexture.downscale = dsf.downscale;

    // Record the texture creation
    root.resources.recordCreate(parentImage, texture);
  }

  /**
   * Calculates the dimensions and scale factor (`1 / downscale`) for a 2D canvas or WebGL texture
   * @param handle Handle of the object being created (for logging purposes)
   * @param isTexture True for WebGL textures; false for 2D canvases
   * @param dimensions Requested dimensions or downscale ratio of the canvas. This value is used to support the
   *    `imageOptions.preserveDownscaledDimensions` optimization and is ignored if this optimization is disabled.
   */
  public calculateDimensionsAndScaleFactor(handle: string, isTexture: boolean, dimensions?: FimDimensions):
      { downscale: number, scaledDimensions: FimDimensions } {
    const me = this;
    const parentImage = me.parentImage;
    const dim = parentImage.dim;
    const options = parentImage.getImageOptions();
    const root = parentImage.rootObject;
    const caps = root.capabilities;

    // We build an array of downscale values. The minimum one wins.
    const downscaleValues = [options.downscale];
    if (isTexture) {
      downscaleValues.push(options.glDownscale);
    }

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
      if (!me.autoDownscaleWarningLogged) {
        root.writeWarning(parentImage, `Auto-downscale ${handle}: ${dim} > max (${root.maxImageDimensions})`);
        me.autoDownscaleWarningLogged = true;
      }
    }

    // Calculate the scale factor and new dimensions
    const downscale = Math.min(...downscaleValues);
    const scaledDimensions = dim.rescale(downscale).toFloor();
    return { downscale, scaledDimensions };
  }

  /** Boolean used to ensure we only log an auto-downscale warning once per image */
  private autoDownscaleWarningLogged = false;

  /** Ensures `contentCanvas.imageContent` is allocated and contains the current image data */
  public async populateContentCanvas(): Promise<void> {
    const me = this;
    const parentImage = me.parentImage;
    const root = parentImage.rootObject;
    const optimizer = root.optimizer;

    if (me.contentCanvas.isCurrent) {
      // If a canvas is already current, this function is a no-op
    } else if (me.contentFillColor.isCurrent) {
      // Copy the fill color to the canvas to make it current
      me.allocateContentCanvas();
      me.contentCanvas.imageContent.fillSolid(me.contentFillColor.imageContent);

      optimizer.recordImageWrite(parentImage, ImageType.Canvas);
    } else if (me.contentTexture.isCurrent) {
      // First, get the WebGL canvas. The getWebGLCanvas() call will allocate or resize it if necessary.
      const srcTexture = me.contentTexture.imageContent;
      const glCanvas = root.getWebGLCanvas();

      // Calculate the coordinates to use on the WebGL canvas
      const glCanvasDim = srcTexture.dim.fitInside(glCanvas.dim).toFloor();
      const glCanvasCoords = FimRect.fromDimensions(glCanvasDim);

      // Copy texture to the WebGL canvas
      glCanvas.copyFrom(srcTexture, undefined, glCanvasCoords);

      // Copy the WebGL canvas to a 2D canvas
      me.allocateContentCanvas(glCanvasDim);
      await me.contentCanvas.imageContent.copyFromAsync(glCanvas, glCanvasCoords);

      optimizer.recordImageRead(parentImage, ImageType.Texture);
      optimizer.recordImageWrite(parentImage, ImageType.Canvas);
    } else {
      FimError.throwOnImageUninitialized(parentImage.handle);
    }

    me.markCurrent(me.contentCanvas, false);
    optimizer.recordImageRead(parentImage, ImageType.Canvas);
  }

  /**
   * Ensures `contentTexture.imageContent` is allocated and contains the current image data
   * @returns The `CoreTexture` instance backing the content texture
   */
  public async populateContentTexture(): Promise<CoreTexture> {
    const me = this;
    const parentImage = me.parentImage;
    const optimizer = parentImage.rootObject.optimizer;

    if (me.contentTexture.isCurrent) {
      // If a texture is already current, this function is a no-op
    } else if (me.contentFillColor.isCurrent) {
      // Fill texture with solid color
      me.allocateContentTexture();
      me.contentTexture.imageContent.fillSolid(me.contentFillColor.imageContent);

      optimizer.recordImageWrite(parentImage, ImageType.Texture);
    } else if (me.contentCanvas.isCurrent) {
      // Copy canvas to texture
      const srcImage = me.contentCanvas.imageContent;
      me.allocateContentTexture(srcImage.dim);
      await me.contentTexture.imageContent.copyFromAsync(srcImage);

      optimizer.recordImageRead(parentImage, ImageType.Canvas);
      optimizer.recordImageWrite(parentImage, ImageType.Texture);
    } else {
      FimError.throwOnImageUninitialized(parentImage.handle);
    }

    me.markCurrent(me.contentTexture, false);
    optimizer.recordImageRead(parentImage, ImageType.Texture);
    return me.contentTexture.imageContent;
  }

  /** Releases any resources used by `contentCanvas.imageContent` */
  public releaseContentCanvas(): void {
    const me = this;
    const parentImage = me.parentImage;
    const canvas = me.contentCanvas;

    if (canvas.imageContent) {
      // Record the canvas disposal
      parentImage.rootObject.resources.recordDispose(parentImage, canvas.imageContent);

      canvas.imageContent.dispose();
      canvas.imageContent = undefined;
      canvas.isCurrent = false;
    }
  }

  /** Releases any resources used by `contentTexture.imageContent` */
  public releaseContentTexture(): void {
    const me = this;
    const parentImage = me.parentImage;
    const texture = me.contentTexture;

    if (texture.imageContent) {
      // Record the texture disposal
      parentImage.rootObject.resources.recordDispose(parentImage, texture.imageContent);

      texture.imageContent.dispose();
      texture.imageContent = undefined;
      texture.isCurrent = false;
    }
  }
}
