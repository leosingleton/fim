// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreTexture } from '../core/CoreTexture';
import { FimColor } from '../primitives/FimColor';

/** Wrapper around textures and canvases containing the image content */
export abstract class ImageContent<T> {
  /** Texture or canvas containing the image content. May be undefined if unallocated. */
  public imageContent?: T;

  /** True if `imageContent` contains the latest image. False if it is out-of-date. */
  public isCurrent = false;

  /**
   * Downscale factor which can be passed to `FimGeometry.rescale()` to convert coordinates from the `EngineImage`'s
   * virtual dimensions to the actual dimensions of the underlying `imageContent` object
   */
  public downscale = 1;
}

/** Implementation of `ImageContent` for `FimColor` */
export class ColorImageContent extends ImageContent<FimColor> {
}

/** Implementation of `ImageContent` for `CoreCanvas2D` */
export class CanvasImageContent extends ImageContent<CoreCanvas2D> {
}

/** Implementation of `ImageContent` for `CoreTexture` */
export class TextureImageContent extends ImageContent<CoreTexture> {
}

/** Collection of representations of the same image, used by `EngineImage` to store its data */
export class ImageCollection {
  /** Contains the color of the image if the contents are a solid color */
  public readonly contentFillColor = new ColorImageContent();

  /** Contains the contents of the image as a 2D canvas */
  public readonly contentCanvas = new CanvasImageContent();

  /** Contains the contents of the image as a WebGL texture */
  public readonly contentTexture = new TextureImageContent();
}
