// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor, FimImage } from '@leosingleton/fim';
import { CoreCanvas2D, CoreTexture, EngineImage } from '@leosingleton/fim/internals';

/** Helper functions for accessing the internals of the `FimImage` class */
export namespace ImageInternals {
  /** Returns whether the image has a current solid fill color */
  export function hasFill(image: FimImage): boolean {
    return (image as EngineImage).contentFillColor.isCurrent;
  }

  /** Returns the solid fill color backing the image */
  export function getFill(image: FimImage): FimColor {
    return (image as EngineImage).contentFillColor.imageContent;
  }

  /** Returns whether the image has a current canvas */
  export function hasCanvas(image: FimImage): boolean {
    return (image as EngineImage).contentCanvas.isCurrent;
  }

  /** Returns the downscale value of the canvas backing the image */
  export function getCanvasDownscale(image: FimImage): number {
    return (image as EngineImage).contentCanvas.downscale;
  }

  /** Returns the canvas backing the image */
  export function getCanvas(image: FimImage): CoreCanvas2D {
    return (image as EngineImage).contentCanvas.imageContent;
  }

  /** Returns whether the image has a current WebGL texture */
  export function hasTexture(image: FimImage): boolean {
    return (image as EngineImage).contentTexture.isCurrent;
  }

  /** Returns the downscale value of the texture backing the image */
  export function getTextureDownscale(image: FimImage): number {
    return (image as EngineImage).contentTexture.downscale;
  }

  /** Returns the WebGL texture backing the image */
  export function getTexture(image: FimImage): CoreTexture {
    return (image as EngineImage).contentTexture.imageContent;
  }
}
