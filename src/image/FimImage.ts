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


  /**
   * Copies pixels from another image to this image. Note that not all image types can be copied to others. Refer to
   * the docs for details.
   * @param srcImage Source image
   * @param srcCoords Source coordinates to copy from, in pixels
   * @param destCoords Destination coordinates to copy to, in pixels
   */
  public copyFrom(srcImage: FimImage, srcCoords?: FimRect, destCoords?: FimRect): void {
    if (!srcCoords) {
      srcCoords = srcImage.dimensions;
    }
    if (!destCoords) {
      destCoords = this.dimensions;
    }

    this.copyFromInternal(srcImage, srcCoords, destCoords);
  }

  /**
   * Copies pixels from another image to this image. Note that not all image types can be copied to others. Refer to
   * the docs for details.
   * @param srcImage Source image
   * @param srcCoords Source coordinates to copy from, in pixels
   * @param destCoords Destination coordinates to copy to, in pixels
   */
  protected abstract copyFromInternal(srcImage: FimImage, srcCoords: FimRect, destCoords: FimRect): void;

  public abstract dispose(): void;
}
