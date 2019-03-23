// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';
import { FimImageType } from './FimImageType';
import { FimRect } from '../primitives';

/** An image consisting of 8-bit greyscale pixel data in a Uint8ClampedArray */
export class FimGreyscaleBuffer extends FimImage {
  /**
   * Creates an image consisting of 8-bit greyscale pixel data in a Uint8Array
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this value (0 to 255).
   */
  constructor(width: number, height: number, initialColor?: number) {
    super(width, height);
    this.buffer = new Uint8ClampedArray(width * height);

    if (initialColor) {
      this.fill(initialColor);
    }
  }

  public readonly type = FimImageType.FimGreyscaleBuffer;

  /** Returns the underlying Uint8Array of RGBA pixel data */
  public getBuffer(): Uint8ClampedArray {
    return this.buffer;
  }
  private buffer: Uint8ClampedArray;
  
  public dispose(): void {
    if (this.buffer) {
      delete this.buffer;
    }
  }

  /** Fills the canvas with a solid color (0 to 255) */
  public fill(color: number): void {
    this.buffer.fill(color);
  }

  /**
   * Copies image from another FimGreyscaleBuffer. Supports cropping, but not rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFromGreyscaleBuffer(srcImage: FimGreyscaleBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.dimensions;
    destCoords = destCoords || this.dimensions;

    // Rescaling is not supported
    this.throwOnRescale(srcCoords, destCoords);

    // Optimization: If images have the same dimensions, just copy the entire byte array
    if (srcCoords.equals(destCoords) && srcImage.dimensions.equals(srcCoords) && this.dimensions.equals(destCoords)) {
      this.buffer.set(srcImage.buffer);
      return;
    }

    // Perform a copy of the image data
    let srcBuf = srcImage.buffer;
    let destBuf = this.buffer;
    for (let y = 0; y < destCoords.h; y++) {
      let srcOffset = (y + srcCoords.yTop) * srcImage.bufferWidth + srcCoords.xLeft;
      let destOffset = (y + destCoords.yTop) * this.bufferWidth + destCoords.xLeft;
      destBuf.set(srcBuf.subarray(srcOffset, srcOffset + destCoords.w), destOffset);
    }
  }

  public getPixel(x: number, y: number): number {
    return this.buffer[y * this.w + x];
  }

  public setPixel(x: number, y: number, color: number): void {
    this.buffer[y * this.w + x] = color;
  }
}
