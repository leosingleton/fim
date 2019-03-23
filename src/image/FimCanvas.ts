// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';
import { FimImageType } from './FimImageType';
import { FimCanvasDrawingContext } from './FimCanvasDrawingContext';
import { FimColor, FimRect } from '../primitives';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimRgbaBuffer } from './FimRgbaBuffer';
import { FimImageBitmap } from './FimImageBitmap';

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
    using(new FimCanvasDrawingContext(this.canvasElement, imageSmoothingEnabled, operation, alpha), ctx => {
      ctx.context.drawImage(inputCanvas.canvasElement, src.xLeft, src.yTop, src.w, src.h, dest.xLeft, dest.yTop,
        dest.w, dest.h);
    });
  }

  /** Boilerplate code for performing a canvas compositing operation with a solid color */
  private opWithColor(color: string, operation: string, alpha: number): void {
    using(new FimCanvasDrawingContext(this.canvasElement, false, operation, alpha), ctx => {
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
   * Copies image from a FimRgbaBuffer. Supports both cropping and rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public async copyFromRgbaBuffer(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    // According to https://stackoverflow.com/questions/7721898/is-putimagedata-faster-than-drawimage/7722892,
    // drawImage() is faster than putImageData() on most browsers. Plus, it supports cropping and rescaling.
    // In addition, on Chrome 72, the pixel data was being slightly changed by putImageData() and breaking unit tests.
    // However, createImageBitmap() is not yet supported on Safari or Edge.
    if (typeof createImageBitmap !== 'undefined') {
      return this.copyFromRgbaBufferWithImageBitmap(srcImage, srcCoords, destCoords);
    } else {
      this.copyFromRgbaBufferWithPutImageData(srcImage, srcCoords, destCoords);
    }
  }

  /**
   * Copies image from a FimRgbaBuffer using createImageBitmap(). Supports both cropping and rescaling.
   * 
   * NOTE: This is generally faster than copyFromRgbaBufferWithPutImageData(), however it is not supported on all web
   *    browsers. As of March 2019, Safari and Edge do not yet support it.
   * 
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public async copyFromRgbaBufferWithImageBitmap(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect):
      Promise<void> {
    // Default parameters
    srcCoords = srcCoords || srcImage.dimensions;
    destCoords = destCoords || this.dimensions;

    // Enable image smoothing if we are rescaling the image
    let imageSmoothingEnabled = !srcCoords.sameDimensions(destCoords);

    usingAsync(new FimCanvasDrawingContext(this.canvasElement, imageSmoothingEnabled), async ctx => {
      let imageData = new ImageData(srcImage.getBuffer(), srcImage.dimensions.w, srcImage.dimensions.h);
      using(await FimImageBitmap.create(imageData), imageBitmap => {
        ctx.context.drawImage(imageBitmap.bitmap, srcCoords.xLeft, srcCoords.yTop, srcCoords.w, srcCoords.h,
          destCoords.xLeft, destCoords.yTop, destCoords.w, destCoords.h);
      });
    });  
  }

  /**
   * Copies image from a FimRgbaBuffer using putImageData(). Supports both cropping and rescaling.
   * 
   * NOTE: This method has good browser compatibility, however Chrome 72 has an issue where the pixel data gets
   *    slightly changed by putImageData() and results in lower quality.
   * 
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFromRgbaBufferWithPutImageData(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.dimensions;
    destCoords = destCoords || this.dimensions;
    
    if (srcCoords.equals(srcImage.dimensions) && srcCoords.sameDimensions(destCoords)) {
      // Fast case: no cropping or rescaling
      using(new FimCanvasDrawingContext(this.canvasElement), ctx => {
        let pixels = ctx.context.createImageData(srcCoords.w, srcCoords.h);
        pixels.data.set(srcImage.getBuffer());
        ctx.context.putImageData(pixels, destCoords.xLeft, destCoords.yTop);
      });
    } else {  
      // Really slow case: Cropping or rescaling is required. Render to a temporary canvas, then copy.
      using(new FimCanvas(srcImage.w, srcImage.h), temp => {
        temp.copyFromRgbaBuffer(srcImage);
        this.copyFromCanvas(temp, srcCoords, destCoords);
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
    using(new FimCanvasDrawingContext(this.canvasElement), ctx => {
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
