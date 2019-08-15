// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';
import { FimRgbaBuffer } from './FimRgbaBuffer';
import { FimRect } from '../primitives/FimRect';

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
    this._buffer = new Uint8ClampedArray(width * height);

    if (initialColor) {
      this.fillCanvas(initialColor);
    }
  }

  /** Returns the underlying Uint8Array of RGBA pixel data */
  public getBuffer(): Uint8ClampedArray {
    return this._buffer;
  }
  private _buffer: Uint8ClampedArray;
  
  public dispose(): void {
    if (this._buffer) {
      delete this._buffer;
    }
  }

  /** Fills the canvas with a solid color (0 to 255) */
  public fillCanvas(color: number): void {
    this._buffer.fill(color);
  }

  /**
   * Copies image from another FimGreyscaleBuffer. Supports cropping, but not rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFrom(srcImage: FimGreyscaleBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.imageDimensions;
    destCoords = destCoords || this.imageDimensions;

    // Rescaling is not supported
    this.throwOnRescale(srcCoords, destCoords);

    // Optimization: If images have the same dimensions, just copy the entire byte array
    if (srcCoords.equals(destCoords) && srcImage.imageDimensions.equals(srcCoords) &&
        this.imageDimensions.equals(destCoords)) {
      this._buffer.set(srcImage._buffer);
      return;
    }

    // Perform a copy of the image data
    let srcBuf = srcImage._buffer;
    let destBuf = this._buffer;
    for (let y = 0; y < destCoords.h; y++) {
      let srcOffset = (y + srcCoords.yTop) * srcImage.w + srcCoords.xLeft;
      let destOffset = (y + destCoords.yTop) * this.w + destCoords.xLeft;
      destBuf.set(srcBuf.subarray(srcOffset, srcOffset + destCoords.w), destOffset);
    }
  }

  /**
   * Copies image to another. Supports cropping, but not rescaling.
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyTo(destImage: FimGreyscaleBuffer | FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    destImage.copyFrom(this, srcCoords, destCoords);
  }
  
  public getPixel(x: number, y: number): number {
    return this._buffer[y * this.w + x];
  }

  public setPixel(x: number, y: number, color: number): void {
    this._buffer[y * this.w + x] = color;
  }
}
