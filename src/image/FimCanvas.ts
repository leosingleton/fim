// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';
import { FimImageType } from './FimImageType';
import { FimCanvasDrawingContext } from './FimCanvasDrawingContext';
import { FimColor, FimRect } from '../primitives';
import { using } from '@leosingleton/commonlibs';
import { FimRgbaBuffer } from './FimRgbaBuffer';

/** An image consisting of an invisible HTML canvas on the DOM */
export class FimCanvas extends FimImage {
  /**
   * Creates an invisible canvas in the DOM
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   */
  public constructor(width: number, height: number, initialColor?: FimColor | string) {
    super(width, height);

    // Create a hidden canvas
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    this.canvasElement = canvas;

    if (initialColor) {
      this.fill(initialColor);
    }
  }

  /** Returns the underlying HTMLCanvasElement */
  public getCanvas(): HTMLCanvasElement {
    return this.canvasElement;
  }
  private canvasElement: HTMLCanvasElement;

  public readonly type = FimImageType.FimCanvas;

  public dispose(): void {
    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement);
      delete this.canvasElement;
    }
  }

  /** Creates a new FimCanvas which is a duplicate of this one */
  public duplicate(): FimCanvas {
    let dupe = new FimCanvas(this.dimensions.w, this.dimensions.h);
    dupe.copyFromCanvas(this, this.dimensions, this.dimensions);
    return dupe;
  }

  /**
   * Boilerplate code for performing a canvas compositing operation with two canvases. If input and output canvases
   * differ in size, the operation is scaled to fill the output canvas.
   */
  private opWithSrcDest(inputCanvas: FimCanvas, operation: string, alpha: number, src: FimRect, dest: FimRect,
      imageSmoothingEnabled = false): void {
    using(new FimCanvasDrawingContext(this.canvasElement, operation, alpha, imageSmoothingEnabled), ctx => {
      ctx.context.drawImage(inputCanvas.canvasElement, src.xLeft, src.yTop, src.w, src.h, dest.xLeft, dest.yTop,
        dest.w, dest.h);
    });
  }

  /** Boilerplate code for performing a canvas compositing operation with a solid color */
  private opWithColor(color: string, operation: string, alpha: number): void {
    using(new FimCanvasDrawingContext(this.canvasElement, operation, alpha), ctx => {
      ctx.context.fillStyle = color;
      ctx.context.fillRect(0, 0, this.dimensions.w, this.dimensions.h);  
    });
  }

  /** Fills the canvas with a solid color */
  public fill(color: FimColor | string): void {
    if (typeof(color) === 'string') {
      this.opWithColor(color, 'copy', 1);
    } else {
      this.opWithColor(color.string, 'copy', 1);
    }
  }

  /**
   * Copies image from another FimCanvas. Supports both cropping and rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFromCanvas(srcImage: FimCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.dimensions;
    destCoords = destCoords || this.dimensions;

    // copy is slightly faster than source-over
    let op = destCoords.equals(this.dimensions) ? 'copy' : 'source-over';

    // Enable image smoothing if we are rescaling the image
    let imageSmoothingEnabled = !srcCoords.sameDimensions(destCoords);
    
    this.opWithSrcDest(srcImage, op, 1, srcCoords, destCoords, imageSmoothingEnabled);
  }

  /**
   * Copies image from a FimRgbaBuffer. Supports cropping, but not rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFromRgbaBuffer(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.dimensions;
    destCoords = destCoords || this.dimensions;

    // Ensure width and height are the same for src and destination. We don't support rescaling.
    if (!srcCoords.sameDimensions(destCoords)) {
      throw new Error('Rescale not supported: ' + srcCoords + ' ' + destCoords);
    }
    
    if (srcCoords.equals(srcImage.dimensions)) {
      // Fast case: input is the entire RgbaBuffer
      using (new FimCanvasDrawingContext(this.canvasElement), ctx => {
        let pixels = ctx.context.createImageData(srcCoords.w, srcCoords.h);
        pixels.data.set(srcImage.getBuffer());
        ctx.context.putImageData(pixels, destCoords.xLeft, destCoords.yTop);
      });
    } else {
      // Slow case: input is a subset of the RgbaBuffer. Make a cropped RgbaBuffer and recurse.
      using (new FimRgbaBuffer(srcCoords.w, srcCoords.h), buffer => {
        buffer.copyFromRgbaBuffer(srcImage, srcCoords);
        this.copyFromRgbaBuffer(buffer, buffer.dimensions, destCoords);
      });
    }
  }

  /**
   * Exports part of the image to an RGBA byte array
   * @param x X-offset, in pixels
   * @param y Y-offset, in pixels
   * @param w Width, in pixels
   * @param h Height, in pixels
   */
  public getRgbaBytes(x: number, y: number, w: number, h: number): Uint8ClampedArray {
    let result: Uint8ClampedArray;
    using (new FimCanvasDrawingContext(this.canvasElement), ctx => {
      result = ctx.context.getImageData(x, y, w, h).data;      
    });
    return result;
  }

  /**
   * Returns the value of one pixel
   * @param x X-offset, in pixels
   * @param y Y-offset, in pixels
   * @returns 4-byte Uint8Array containing RGBA values
   */
  public getPixel(x: number, y: number): FimColor {
    let pixel = this.getRgbaBytes(x, y, 1, 1);
    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }
}
