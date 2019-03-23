// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IDisposable } from '@leosingleton/commonlibs';
import { FimImageType } from './FimImageType';
import { FimRect } from '../primitives';

/**
 * Base class for FIM classes that hold images. Once created, the image dimensions are immutable, however the contents
 * of the image itself may be changed with copyFrom() or other functions.
 */
export abstract class FimImage implements IDisposable {
  public constructor(width: number, height: number, bufferWidth?: number, bufferHeight?: number) {
    this.w = width;
    this.h = height;
    this.dimensions = FimRect.fromXYWidthHeight(0, 0, width, height);
    
    this.bufferWidth = bufferWidth ? bufferWidth : width;
    this.bufferHeight = bufferHeight ? bufferHeight : height;
    this.bufferDimensions = FimRect.fromXYWidthHeight(0, 0, this.bufferWidth, this.bufferHeight);
  }

  /** Returns a value from the FimImageType enum indicating the implementation of the class */
  public abstract readonly type: FimImageType;

  /** Width of the image, in pixels */
  public readonly w: number;

  /** Height of the image, in pixels */
  public readonly h: number;

  /** Dimensions of the image, in pixels. The x/y coordinates are always zero. */
  public readonly dimensions: FimRect;

  /**
   * Width of the backing buffer, in pixels. This may be larger than w if the implementation rounds to a larger image
   * for performance, such as some GPUs which require a power-of-two dimension.
   */
  public readonly bufferWidth: number;

  /**
   * Height of the backing buffer, in pixels. This may be larger than h if the implementation rounds to a larger image
   * for performance, such as some GPUs which require a power-of-two dimension.
   */
  public readonly bufferHeight: number;

  /**
   * Dimensions of the backing buffer, in pixels. This may be larger than dimensions if the implementation rounds to a
   * larger image for performance, such as some GPUs which require a power-of-two dimension.
   */
  public readonly bufferDimensions: FimRect;

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
