// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IDisposable } from '@leosingleton/commonlibs';
import { FimImageKind } from './FimImageKind';
import { FimRect, IFimDimensions, rescale } from '../primitives';

/**
 * Base class for FIM classes that hold images. Once created, the image dimensions are immutable, however the contents
 * of the image itself may be changed with copyFrom() or other functions.
 */
export abstract class FimImage implements IDisposable, IFimDimensions {
  /** Returns a value from the FimImageKind string union indicating the implementation of the class */
  public abstract readonly kind: FimImageKind;

  public constructor(width: number, height: number, maxDimension = 0) {
    // Some resources, like WebGL textures, have limited dimensions. If the requested width and height exceed this,
    // automatically downscale the requested resolution.
    this.downscaled = false;
    if (maxDimension > 0 && (width > maxDimension || height > maxDimension)) {
      let newDimensions = rescale(width, height, maxDimension);
      width = newDimensions.w;
      height = newDimensions.h;
      this.downscaled = true;
    }

    this.w = width;
    this.h = height;
    this.dimensions = FimRect.fromXYWidthHeight(0, 0, width, height);
  }

  // IFimDimensions implementation
  public readonly w: number;
  public readonly h: number;
  public readonly dimensions: FimRect;

  /** Set if the dimensions of the image have been downscaled from those requested in the constructor */
  public readonly downscaled: boolean;

  public abstract dispose(): void;

  /**
   * Helper function called by copyFrom() functions to ensures the width and height are the same for source and
   * destination. If not, it throws an error that rescaling is not supported.
   * @param srcCoords Source coordinations
   * @param destCoords Destination coordinates
   */
  protected throwOnRescale(srcCoords: FimRect, destCoords: FimRect): void {
    if (!srcCoords.sameDimensions(destCoords)) {
      throw new Error(`Rescale not supported: ${srcCoords} ${destCoords}`);
    }
  }

  /**
   * Helper function called by copyFrom() functions that do not support crop or rescaling. Throws an error if the
   * source image does not have the same dimensions as this image.
   * @param srcImage Source image
   */
  protected throwOnMismatchedDimensions(srcImage: FimImage): void {
    if (!this.dimensions.equals(srcImage.dimensions)) {
      throw new Error(`Crop and rescale not supported: ${this.dimensions} ${srcImage.dimensions}`);
    }
  }

  /**
   * Helper function called by functions that use union types and encounter an invalid FimImage type. This uses
   * TypeScript's never type to generate compile-time warnings for unhandled types.
   * @param fimImage Invalid FimImage object
   */
  protected throwOnInvalidImageKind(fimImage: never): never {
    throw new Error(`Invalid kind: ${fimImage}`);
  }
}
