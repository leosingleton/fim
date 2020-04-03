// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor, FimImage } from '@leosingleton/fim';
import { CoreCanvas2D, CoreTexture, ImageCollection } from '@leosingleton/fim/internals';

/** Helper functions for accessing the internals of the `FimImage` class */
export namespace ImageInternals {
  /** Gets the private `imageContent` property from a `FimImage` instance */
  export function getImageContent(image: FimImage): ImageCollection {
    return (image as any).imageContent;
  }

  /** Returns whether the image has a current solid fill color */
  export function hasFill(image: FimImage): boolean {
    return getImageContent(image).contentFillColor.isCurrent;
  }

  /** Returns the solid fill color backing the image */
  export function getFill(image: FimImage): FimColor {
    return getImageContent(image).contentFillColor.imageContent;
  }

  /** Returns whether the image has a current canvas */
  export function hasCanvas(image: FimImage): boolean {
    return getImageContent(image).contentCanvas.isCurrent;
  }

  /** Returns the downscale value of the canvas backing the image */
  export function getCanvasDownscale(image: FimImage): number {
    return getImageContent(image).contentCanvas.downscale;
  }

  /** Returns the canvas backing the image */
  export function getCanvas(image: FimImage): CoreCanvas2D {
    return getImageContent(image).contentCanvas.imageContent;
  }

  /** Returns whether the image has a current WebGL texture */
  export function hasTexture(image: FimImage): boolean {
    return getImageContent(image).contentTexture.isCurrent;
  }

  /** Returns the downscale value of the texture backing the image */
  export function getTextureDownscale(image: FimImage): number {
    return getImageContent(image).contentTexture.downscale;
  }

  /** Returns the WebGL texture backing the image */
  export function getTexture(image: FimImage): CoreTexture {
    return getImageContent(image).contentTexture.imageContent;
  }
}
