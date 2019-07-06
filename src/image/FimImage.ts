// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IDisposable } from '@leosingleton/commonlibs';
import { FimImageType } from './FimImageType';
import { FimRect, IFimDimensions } from '../primitives';

/**
 * Base class for FIM classes that hold images. Once created, the image dimensions are immutable, however the contents
 * of the image itself may be changed with copyFrom() or other functions.
 */
export abstract class FimImage implements IDisposable, IFimDimensions {
  public constructor(width: number, height: number) {
    this.w = width;
    this.h = height;
    this.dimensions = FimRect.fromXYWidthHeight(0, 0, width, height);
  }

  /** Returns a value from the FimImageType enum indicating the implementation of the class */
  public abstract getType(): FimImageType;

  // IFimDimensions implementation
  public readonly w: number;
  public readonly h: number;
  public readonly dimensions: FimRect;

  public abstract dispose(): void;

  /**
   * Helper function called by copyFrom() functions to ensures the width and height are the same for source and
   * destination. If not, it throws an error that rescaling is not supported.
   * @param srcCoords Source coordinations
   * @param destCoords Destination coordinates
   */
  protected throwOnRescale(srcCoords: FimRect, destCoords: FimRect): void {
    if (!srcCoords.sameDimensions(destCoords)) {
      throw new Error('Rescale not supported: ' + srcCoords + ' ' + destCoords);
    }
  }

  /**
   * Helper function called by copyFrom() functions that do not support crop or rescaling. Throws an error if the
   * source image does not have the same dimensions as this image.
   * @param srcImage Source image
   */
  protected throwOnMismatchedDimensions(srcImage: FimImage): void {
    if (!this.dimensions.equals(srcImage.dimensions)) {
      throw new Error('Crop and rescale not supported: ' + this.dimensions + ' ' + srcImage.dimensions);
    }
  }
}
