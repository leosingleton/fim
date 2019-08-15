// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from './FimCanvas';
import { FimGreyscaleBuffer } from './FimGreyscaleBuffer';
import { FimImage } from './FimImage';
import { IFimGetSetPixel } from './IFimGetSetPixel';
import { FimGLCanvas } from '../gl/FimGLCanvas';
import { FimColor } from '../primitives/FimColor';
import { FimRect } from '../primitives/FimRect';
import { using } from '@leosingleton/commonlibs';

/** An image consisting of 8-bit RGBA pixel data in a Uint8ClampedArray */
export class FimRgbaBuffer extends FimImage implements IFimGetSetPixel {
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
      this.fillCanvas(initialColor);
    }
  }

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
  public fillCanvas(color: FimColor | string): void {
    if (typeof color === 'string') {
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
   * Copies image from another. Supports cropping, but rescaling is only supported on some input types.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFrom(srcImage: FimCanvas | FimGLCanvas | FimGreyscaleBuffer | FimRgbaBuffer, srcCoords?: FimRect,
      destCoords?: FimRect): void {
    if (srcImage instanceof FimCanvas || srcImage instanceof FimGLCanvas) {
      this.copyFromCanvas(srcImage, srcCoords, destCoords);
    } else if (srcImage instanceof FimGreyscaleBuffer) {
      this.copyFromGreyscaleBuffer(srcImage, srcCoords, destCoords);
    } else if (srcImage instanceof FimRgbaBuffer) {
      this.copyFromRgbaBuffer(srcImage, srcCoords, destCoords);
    } else {
      this.throwOnInvalidImageKind(srcImage);
    }
  }

  /**
   * Copies image from a FimCanvas. Supports cropping and rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  private copyFromCanvas(srcImage: FimCanvas | FimGLCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.imageDimensions;
    destCoords = destCoords || this.imageDimensions;
    let origSrcCoords = srcCoords;

    // Scale the input coordinates. The destination RgbaBuffer doesn't support downscaling.
    srcCoords = srcCoords.scale(srcImage.downscaleRatio);

    if (!destCoords.equals(this.imageDimensions)) {
      // Slow case: The destination is not the entire image. Use a temporary RgbaBuffer.
      using(new FimRgbaBuffer(destCoords.w, destCoords.h), buffer => {
        buffer.copyFromCanvas(srcImage, origSrcCoords);
        this.copyFromRgbaBuffer(buffer, undefined, destCoords);
      });
    } else if ((srcImage instanceof FimCanvas) && srcCoords.w === destCoords.w && srcCoords.h === destCoords.h) {
      // Fast case: the destination is this entire image, we don't have to rescale, and the input is an HtmlCanvas.
      // We can't copy directly from a WebGL canvas, either.
      this.copyFromCanvasInternal(srcImage, srcCoords);
    } else {
      // Slow case: Use a temporary canvas.
      using(new FimCanvas(destCoords.w, destCoords.h), canvas => {
        canvas.copyFrom(srcImage, origSrcCoords);
        this.copyFromCanvasInternal(canvas, canvas.realDimensions);
      });
    }
  }

  private copyFromCanvasInternal(srcImage: FimCanvas, srcCoords: FimRect): void {
    // Copy data from a normal HtmlCanvas
    using(srcImage.createDrawingContext(), ctx => {
      let imgData = ctx.getImageData(srcCoords.xLeft, srcCoords.yTop, srcCoords.w, srcCoords.h);
      this.buffer = imgData.data;
    });
  }

  /**
   * Copies image from a FimGreyscaleBuffer. Supports cropping, but not rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  private copyFromGreyscaleBuffer(srcImage: FimGreyscaleBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.imageDimensions;
    destCoords = destCoords || this.imageDimensions;

    // Rescaling is not supported
    this.throwOnRescale(srcCoords, destCoords);

    // Perform a copy of the image data
    let srcBuf = srcImage.getBuffer();
    let destBuf = this.buffer;
    for (let y = 0; y < destCoords.h; y++) {
      let srcOffset = (y + srcCoords.yTop) * srcImage.w + srcCoords.xLeft;
      let destOffset = ((y + destCoords.yTop) * this.w + destCoords.xLeft) * 4;
      for (let x = 0; x < destCoords.w; x++) {
        let color = srcBuf[srcOffset++];
        destBuf[destOffset++] = color;
        destBuf[destOffset++] = color;
        destBuf[destOffset++] = color;
        destBuf[destOffset++] = 255;
      }
    }    
  }

  /**
   * Copies image from another FimRgbaBuffer. Supports cropping, but not rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  private copyFromRgbaBuffer(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.imageDimensions;
    destCoords = destCoords || this.imageDimensions;

    // Rescaling is not supported
    this.throwOnRescale(srcCoords, destCoords);

    // Optimization: If images have the same dimensions, just copy the entire byte array
    if (srcCoords.equals(destCoords) && srcImage.imageDimensions.equals(srcCoords) &&
        this.imageDimensions.equals(destCoords)) {
      this.buffer.set(srcImage.buffer);
      return;
    }

    // Perform a copy of the image data
    let srcBuf = srcImage.buffer;
    let destBuf = this.buffer;
    for (let y = 0; y < destCoords.h; y++) {
      let srcOffset = ((y + srcCoords.yTop) * srcImage.w + srcCoords.xLeft) * 4;
      let destOffset = ((y + destCoords.yTop) * this.w + destCoords.xLeft) * 4;
      destBuf.set(srcBuf.subarray(srcOffset, srcOffset + (destCoords.w * 4)), destOffset);
    }
  }

  /**
   * Copies image to another.
   * 
   * FimCanvas supports both cropping and rescaling, however FimRgbaBuffer supports only cropping.
   * 
   * Note that for FimCanvas destinations, the copyToAsync() version of this function is faster on most web browsers!
   * 
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyTo(destImage: FimCanvas | FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    destImage.copyFrom(this, srcCoords, destCoords);
  }

  /**
   * Copies image to another.
   * 
   * FimCanvas supports both cropping and rescaling, however FimRgbaBuffer supports only cropping.
   * 
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public async copyToAsync(destImage: FimCanvas | FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect):
      Promise<void> {
    if (destImage instanceof FimCanvas) {
      destImage.copyFromAsync(this, srcCoords, destCoords);
    } else if (destImage instanceof FimRgbaBuffer) {
      destImage.copyFrom(this, srcCoords, destCoords);
    } else {
      this.throwOnInvalidImageKind(destImage);
    }
  }

  public getPixel(x: number, y: number): FimColor {
    let offset = (y * this.w + x) * 4;
    return FimColor.fromRGBABytes(this.buffer[offset], this.buffer[offset + 1], this.buffer[offset + 2],
      this.buffer[offset + 3]);
  }

  public setPixel(x: number, y: number, color: FimColor): void {
    let offset = (y * this.w + x) * 4;
    this.buffer[offset++] = color.r;
    this.buffer[offset++] = color.g;
    this.buffer[offset++] = color.b;
    this.buffer[offset] = color.a;
  }
}
