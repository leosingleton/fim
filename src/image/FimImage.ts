// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimRect, IFimDimensions, rescale } from '../primitives';
import { IDisposable } from '@leosingleton/commonlibs';

/**
 * Base class for FIM classes that hold images. Once created, the image dimensions are immutable, however the contents
 * of the image itself may be changed with copyFrom() or other functions.
 */
export abstract class FimImage implements IDisposable, IFimDimensions {
  /**
   * Constructor
   * @param width Image width, in pixels
   * @param height Image height, in pixels
   * @param maxDimension Image implementations, particularly in WebGL, may have maximum supported dimensions. If the
   *    requested width or height exceeds this, the image will be automatically downscaled.
   */
  public constructor(width: number, height: number, maxDimension = 0) {
    // Some resources, like WebGL textures, have limited dimensions. If the requested width and height exceed this,
    // automatically downscale the requested resolution.
    this.downscaled = false;
    this.downscaleRatio = 1;
    if (maxDimension > 0 && (width > maxDimension || height > maxDimension)) {
      let newDimensions = rescale(width, height, maxDimension);
      this.downscaleRatio = width / newDimensions.w;
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

  /** Ratio of original resolution to downscaled resolution. 1 if the dimensions have not been downscaled. */
  public readonly downscaleRatio: number;

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
