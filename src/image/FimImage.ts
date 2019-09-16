// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IFim } from '../Fim';
import { FimRect } from '../primitives/FimRect';
import { IFimDimensions } from '../primitives/IFimDimensions';
import { IDisposable } from '@leosingleton/commonlibs';

export interface IFimImage extends IDisposable, IFimDimensions {
  /** FIM canvas factory */
  readonly fim: IFim;

  /** 
   * Set to the actual dimensions of the underlying image, which may have been downscaled from those requested in the
   * constructor.
   */
  readonly realDimensions: FimRect;

  /**
   * Ratio of the downscaled resolution to the original resolution. 1 if the dimensions have not been downscaled.
   * Member functions which operate on coordinates should multiply values by this ratio to get coordinates of the
   * underlying image.
   */
  readonly downscaleRatio: number;

  /**
   * A unique ID assigned to each instance of a FimImage object. Useful for debugging, or comparing two images for
   * equality.
   */
  readonly imageId: number;
}

/**
 * Base class for FIM classes that hold images. Once created, the image dimensions are immutable, however the contents
 * of the image itself may be changed with copyFrom() or other functions.
 */
export abstract class FimImage implements IFimImage {
  /**
   * Constructor
   * @param fim FIM canvas factory
   * @param width Image width, in pixels
   * @param height Image height, in pixels
   * @param maxDimension Image implementations, particularly in WebGL, may have maximum supported dimensions. If the
   *    requested width or height exceeds this, the image will be automatically downscaled.
   */
  public constructor(fim: IFim, width: number, height: number, maxDimension = 0) {
    this.w = width = Math.floor(width);
    this.h = height = Math.floor(height);
    this.imageDimensions = this.realDimensions = FimRect.fromWidthHeight(width, height);
    this.fim = fim;

    // Some resources, like WebGL textures, have limited dimensions. If the requested width and height exceed this,
    // automatically downscale the requested resolution.
    this.downscaleRatio = 1;
    if (maxDimension > 0 && (width > maxDimension || height > maxDimension)) {
      let newDimensions = FimRect.downscaleToMaxDimension(width, height, maxDimension);
      this.realDimensions = newDimensions;
      this.downscaleRatio = newDimensions.w / width;
    }

    this.imageId = ++FimImage.imageIdCounter;
  }

  // IFimDimensions implementation
  public readonly w: number;
  public readonly h: number;
  public readonly imageDimensions: FimRect;

  // IFimImage implementation
  public readonly fim: IFim;
  public readonly realDimensions: FimRect;
  public readonly downscaleRatio: number;
  public readonly imageId: number;

  private static imageIdCounter = 0;

  // IDisposable implementation
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
    if (!this.imageDimensions.equals(srcImage.imageDimensions)) {
      throw new Error(`Crop and rescale not supported: ${this.imageDimensions} ${srcImage.imageDimensions}`);
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
