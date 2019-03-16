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
    this.buffer = new Uint8Array(width * height * 4);

    if (initialColor) {
      this.fill(initialColor);
    }
  }

  public readonly type = FimImageType.FimRgbaBuffer;

  /** Returns the underlying Uint8Array of RGBA pixel data */
  public getBuffer(): Uint8Array {
    return this.buffer;
  }
  private buffer: Uint8Array;
  
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
  
  protected copyFromInternal(srcImage: FimImage, srcCoords: FimRect, destCoords: FimRect): void {
    switch (srcImage.type) {
      case FimImageType.FimCanvas:
        this.copyFromFimCanvas(srcImage as FimCanvas, srcCoords, destCoords);
        break;

      case FimImageType.FimRgbaBuffer:
        this.copyFromFimRgbaBuffer(srcImage as FimRgbaBuffer, srcCoords, destCoords);
        break;

      default:
        throw new Error('Not supported: ' + srcImage.type);
    }
  }

  private copyFromFimCanvas(srcImage: FimCanvas, srcCoords: FimRect, destCoords: FimRect): void {
    // Ensure width and height are the same for src and destination. We don't support rescaling.
    if (!srcCoords.sameDimensions(destCoords)) {
      throw new Error('Rescale not supported: ' + srcCoords + ' ' + destCoords);
    }

    if (destCoords.equals(this.dimensions)) {
      // Fast case: the destination is this entire image
      this.copyFromFimCanvasInternal(srcImage, srcCoords);
    } else {
      // Slow case: the destination is only a subset of the image. Use a temporary RGBA buffer.
      using (new FimRgbaBuffer(destCoords.w, destCoords.h), buffer => {
        buffer.copyFromFimCanvasInternal(srcImage, srcCoords);
        this.copyFromFimRgbaBuffer(buffer, buffer.dimensions, destCoords);
      });
    }
  }

  private copyFromFimCanvasInternal(srcImage: FimCanvas, srcCoords: FimRect): void {
    using (new FimCanvasDrawingContext(srcImage.getCanvas()), ctx => {
      let imgData = ctx.context.getImageData(srcCoords.xLeft, srcCoords.yTop, srcCoords.w, srcCoords.h);
      this.buffer = new Uint8Array(imgData.data);
    });
  }

  private copyFromFimRgbaBuffer(srcImage: FimRgbaBuffer, srcCoords: FimRect, destCoords: FimRect): void {
    // Ensure width and height are the same for src and destination. We don't support rescaling.
    if (!srcCoords.sameDimensions(destCoords)) {
      throw new Error('Rescale not supported: ' + srcCoords + ' ' + destCoords);
    }

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
   * @returns 4-byte Uint8Array containing RGBA values
   */
  public getPixel(x: number, y: number): FimColor {
    let offset = (y * this.w + x) * 4;
    return FimColor.fromRGBABytes(this.buffer[offset], this.buffer[offset + 1], this.buffer[offset + 2],
      this.buffer[offset + 3]);
  }
}
