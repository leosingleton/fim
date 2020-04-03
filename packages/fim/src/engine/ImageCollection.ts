// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { OptimizerBase } from './optimizer/OptimizerBase';
import { ResourceTracker } from './optimizer/ResourceTracker';
import { FimImageOptions } from '../api/FimImageOptions';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasOptions } from '../core/CoreCanvasOptions';
import { CoreTexture } from '../core/CoreTexture';
import { CoreTextureOptions } from '../core/CoreTextureOptions';
import { FimColor } from '../primitives/FimColor';
import { FimError } from '../primitives/FimError';

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
    //const options = this.imageCollection.getImageOptions();
    return {};
  }
}

/** Implementation of `ImageContent` for `CoreTexture` */
export class TextureImageContent extends ImageContent<CoreTexture, CoreTextureOptions> {
  public getOptions(): CoreTextureOptions {
    const options = this.imageCollection.getImageOptions();
    return {
      bpp: options.bpp,
      isReadOnly: options.glReadOnly,
      sampling: options.sampling
    };
  }
}

/** Collection of representations of the same image, used by `EngineImage` to store its data */
export class ImageCollection {
  public constructor(public readonly getImageOptions: () => FimImageOptions, public readonly optimizer: OptimizerBase,
    public readonly resources: ResourceTracker) {
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
}
