// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';
import { FimCanvasDrawingContext } from './FimCanvasDrawingContext';
import { FimImageType } from './FimImageType';
import { FimCanvas } from './FimCanvas';
import { FimRect, FimColor } from '../primitives';
import { using } from '@leosingleton/commonlibs';

/** An image consisting of 8-bit RGBA pixel data in a Uint8Array */
export class FimRgbaBuffer extends FimImage {
  /**
   * Creates an image consisting of 8-bit RGBA pixel data in a Uint8Array
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   */
  constructor(width: number, height: number, initialColor?: FimColor | string) {
    super(width, height);
    this.buffer = new Uint8ClampedArray(width * height * 4);

    if (initialColor) {
      this.fill(initialColor);
    }
  }

  public readonly type = FimImageType.FimRgbaBuffer;

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

  /** Fills the canvas with a solid color */
  public fill(color: FimColor | string): void {
    if (typeof(color) === 'string') {
      color = FimColor.fromString(color);
    }

    if (color.r === color.g && color.r === color.b && color.r === color.a) {
      // Optimization: if all components are the same, use the built-in array fill
      this.buffer.fill(color.r);
    } else {
      let buf = this.buffer;
      let len = buf.length;
      let offset = 0;

      while (offset < len) {
        buf[offset++] = color.r;
        buf[offset++] = color.g;
        buf[offset++] = color.b;
        buf[offset++] = color.a;
      }
    }
  }
  
  /**
   * Copies image from a FimCanvas. Supports cropping, but not rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFromCanvas(srcImage: FimCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.dimensions;
    destCoords = destCoords || this.dimensions;

    // Rescaling is not supported
    this.throwOnRescale(srcCoords, destCoords);

    if (destCoords.equals(this.dimensions)) {
      // Fast case: the destination is this entire image
      this.copyFromCanvasInternal(srcImage, srcCoords);
    } else {
      // Slow case: the destination is only a subset of the image. Use a temporary RGBA buffer.
      using(new FimRgbaBuffer(destCoords.w, destCoords.h), buffer => {
        buffer.copyFromCanvasInternal(srcImage, srcCoords);
        this.copyFromRgbaBuffer(buffer, buffer.dimensions, destCoords);
      });
    }
  }

  private copyFromCanvasInternal(srcImage: FimCanvas, srcCoords: FimRect): void {
    using(new FimCanvasDrawingContext(srcImage.getCanvas()), ctx => {
      let imgData = ctx.context.getImageData(srcCoords.xLeft, srcCoords.yTop, srcCoords.w, srcCoords.h);
      this.buffer = new Uint8ClampedArray(imgData.data);
    });
  }

  /**
   * Copies image from another FimRgbaBuffer. Supports cropping, but not rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFromRgbaBuffer(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
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
      let srcOffset = ((y + srcCoords.yTop) * srcImage.bufferWidth + srcCoords.xLeft) * 4;
      let destOffset = ((y + destCoords.yTop) * this.bufferWidth + destCoords.xLeft) * 4;
      destBuf.set(srcBuf.subarray(srcOffset, srcOffset + (destCoords.w * 4)), destOffset);
    }
  }

  /**
   * Returns the value of one pixel
   * @param x X-offset, in pixels
   * @param y Y-offset, in pixels
   * @returns RGBA color value
   */
  public getPixel(x: number, y: number): FimColor {
    let offset = (y * this.w + x) * 4;
    return FimColor.fromRGBABytes(this.buffer[offset], this.buffer[offset + 1], this.buffer[offset + 2],
      this.buffer[offset + 3]);
  }

  /**
   * Sets the value of one pixel
   * @param x X-offset, in pixels
   * @param y Y-offset, in pixels
   * @param color RGBA color value
   */
  public setPixel(x: number, y: number, color: FimColor): void {
    let offset = (y * this.w + x) * 4;
    this.buffer[offset++] = color.r;
    this.buffer[offset++] = color.g;
    this.buffer[offset++] = color.b;
    this.buffer[offset] = color.a;
  }
}
