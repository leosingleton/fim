// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvasBase } from './FimCanvasBase';
import { FimImageKindCanvas, FimImageKindGLCanvas, FimImageKindRgbaBuffer } from './FimImageKind';
import { FimRgbaBuffer } from './FimRgbaBuffer';
import { IFimGetSetPixel } from './IFimGetSetPixel';
import { FimColor, FimRect } from '../primitives';
import { using, makeDisposable, IDisposable, DisposableSet } from '@leosingleton/commonlibs';
import { FimGLCanvas } from '../gl';

/** An image consisting of an invisible HTML canvas on the DOM */
export class FimCanvas extends FimCanvasBase implements IFimGetSetPixel {
  public readonly kind = FimImageKindCanvas;

  /**
   * Creates an invisible canvas in the DOM
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   * @param useOffscreenCanvas If this parameter is true, an offscreen canvas will be used. These can be used in web
   *    workers. Check FimCanvasBase.supportsOffscreenCanvas to determine whether the web browser supports the
   *    OffscreenCanvas feature.
   */
  public constructor(width: number, height: number, initialColor?: FimColor | string,
      useOffscreenCanvas = FimCanvas.supportsOffscreenCanvas) {
    super(width, height, useOffscreenCanvas);

    if (initialColor) {
      this.fill(initialColor);
    }
  }

  /** Creates a new FimCanvas which is a duplicate of this one */
  public duplicate(): FimCanvas {
    let dupe = new FimCanvas(this.dimensions.w, this.dimensions.h);
    dupe.copyFromCanvas(this, this.dimensions, this.dimensions);
    return dupe;
  }

  /**
   * Constructs a drawing context
   * @param imageSmoothingEnabled Enables image smoothing
   * @param operation CanvasRenderingContext2D.globalCompositeOperation value, e.g. 'copy' or 'source-over'
   * @param alpha CanvasRenderingContext2D.alpha value, where 0 = transparent and 1 = opaque
   */
  public createDrawingContext(imageSmoothingEnabled = false, operation = 'copy', alpha = 1):
      CanvasRenderingContext2D & IDisposable {
    let ctx = this.canvasElement.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = operation;
    ctx.globalAlpha = alpha;

    // Disable image smoothing in most common browsers. Still an experimental feature, so TypeScript doesn't seem to
    // support it well...
    // @nomangle imageSmoothingEnabled mozImageSmoothingEnabled webkitImageSmoothingEnabled msImageSmoothingEnabled
    let ctxAny = ctx as any;
    ctxAny['imageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['mozImageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['webkitImageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['msImageSmoothingEnabled'] = imageSmoothingEnabled;

    return makeDisposable(ctx, ctx => ctx.restore());
  }

  /**
   * Boilerplate code for performing a canvas compositing operation with two canvases. If input and output canvases
   * differ in size, the operation is scaled to fill the output canvas.
   */
  private opWithSrcDest(inputCanvas: FimCanvasBase, operation: string, alpha: number, src: FimRect, dest: FimRect,
      imageSmoothingEnabled = false): void {
    using(this.createDrawingContext(imageSmoothingEnabled, operation, alpha), ctx => {
      ctx.drawImage(inputCanvas.getCanvas(), src.xLeft, src.yTop, src.w, src.h, dest.xLeft, dest.yTop,
        dest.w, dest.h);
    });
  }

  /** Boilerplate code for performing a canvas compositing operation with a solid color */
  private opWithColor(color: string, operation: string, alpha: number): void {
    using(this.createDrawingContext(false, operation, alpha), ctx => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.dimensions.w, this.dimensions.h);  
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
   * Copies image from another. All inputs supports both cropping and rescaling.
   * 
   * Note that for FimRgbaBuffer inputs, the Async version of this function may be significantly faster on some web
   * browsers.
   * 
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyFrom(srcImage: FimCanvas | FimGLCanvas | FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    switch (srcImage.kind) {
      case FimImageKindCanvas:
      case FimImageKindGLCanvas:
        return this.copyFromCanvas(srcImage, srcCoords, destCoords);

      case FimImageKindRgbaBuffer:
        return this.copyFromRgbaBuffer(srcImage, srcCoords, destCoords);

      default:
        this.throwOnInvalidImageKind(srcImage);
    }
  }

  /**
   * Copies image from another. All inputs supports both cropping and rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public async copyFromAsync(srcImage: FimCanvas | FimGLCanvas | FimRgbaBuffer, srcCoords?: FimRect,
      destCoords?: FimRect): Promise<void> {
    switch (srcImage.kind) {
      case FimImageKindCanvas:
      case FimImageKindGLCanvas:
        return this.copyFromCanvas(srcImage, srcCoords, destCoords);

      case FimImageKindRgbaBuffer:
        // According to https://stackoverflow.com/questions/7721898/is-putimagedata-faster-than-drawimage/7722892,
        // drawImage() is faster than putImageData() on most browsers. Plus, it supports cropping and rescaling.
        // In addition, on Chrome 72, the pixel data was being slightly changed by putImageData() and breaking unit
        // tests. However, createImageBitmap() is not yet supported on Safari or Edge.
        if (typeof createImageBitmap !== 'undefined') {
          return this.copyFromRgbaBufferWithImageBitmapAsync(srcImage, srcCoords, destCoords);
        }
        return this.copyFromRgbaBuffer(srcImage, srcCoords, destCoords);

      default:
        this.throwOnInvalidImageKind(srcImage);
    }
  }

  private copyFromCanvas(srcImage: FimCanvas | FimGLCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
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
   * Copies image from a FimRgbaBuffer using createImageBitmap(). Supports both cropping and rescaling.
   * 
   * NOTE: This is generally faster than copyFromRgbaBufferWithPutImageData(), however it is not supported on all web
   *    browsers. As of March 2019, Safari and Edge do not yet support it.
   * 
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  private async copyFromRgbaBufferWithImageBitmapAsync(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?:
      FimRect): Promise<void> {
    // Default parameters
    srcCoords = srcCoords || srcImage.dimensions;
    destCoords = destCoords || this.dimensions;

    // Enable image smoothing if we are rescaling the image
    let imageSmoothingEnabled = !srcCoords.sameDimensions(destCoords);

    await DisposableSet.usingAsync(async disposable => {
      let ctx = disposable.addDisposable(this.createDrawingContext(imageSmoothingEnabled));

      let imageData = new ImageData(srcImage.getBuffer(), srcImage.dimensions.w, srcImage.dimensions.h);      
      let imageBitmap = disposable.addNonDisposable(await createImageBitmap(imageData), ib => ib.close());

      ctx.drawImage(imageBitmap, srcCoords.xLeft, srcCoords.yTop, srcCoords.w, srcCoords.h, destCoords.xLeft,
        destCoords.yTop, destCoords.w, destCoords.h);
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
  private copyFromRgbaBuffer(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.dimensions;
    destCoords = destCoords || this.dimensions;
    
    if (srcCoords.equals(srcImage.dimensions) && srcCoords.sameDimensions(destCoords)) {
      // Fast case: no cropping or rescaling
      using(this.createDrawingContext(), ctx => {
        let pixels = ctx.createImageData(srcCoords.w, srcCoords.h);
        pixels.data.set(srcImage.getBuffer());
        ctx.putImageData(pixels, destCoords.xLeft, destCoords.yTop);
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
   * Copies image to another.
   * 
   * FimCanvas destinations support both cropping and rescaling, while FimRgbaBuffer destinations only support
   * cropping.
   * 
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyTo(destImage: FimCanvas | FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void {
    destImage.copyFrom(this, srcCoords, destCoords);
  }

  public getPixel(x: number, y: number): FimColor {
    let pixel: Uint8ClampedArray;

    using(new FimRgbaBuffer(1, 1), buffer => {
      buffer.copyFrom(this, FimRect.fromXYWidthHeight(x, y, 1, 1));
      pixel = buffer.getBuffer();
    });

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }

  public setPixel(x: number, y: number, color: FimColor): void {
    using(new FimRgbaBuffer(1, 1, color), buffer => {
      this.copyFromRgbaBuffer(buffer, buffer.dimensions, FimRect.fromXYWidthHeight(x, y, 1, 1));
    });
  }

  /**
   * Creates a FimCanvas from a JPEG file
   * @param jpegFile JPEG file, loaded into a byte array
   */
  public static async createFromJpeg(jpegFile: Uint8Array, useOffscreenCanvas = FimCanvas.supportsOffscreenCanvas):
      Promise<FimCanvas> {
    return new Promise((resolve, reject) => {
      // Create a Blob holding the binary data and load it onto an HTMLImageElement
      let blob = new Blob([jpegFile], { type: 'image/jpeg' });
      let url = (URL || webkitURL).createObjectURL(blob);
      let img = new Image();
      img.src = url;

      // On success, copy the image to a FimCanvas and return it via the Promise
      img.onload = () => {
        let result = new FimCanvas(img.width, img.height, undefined, useOffscreenCanvas);
        using(result.createDrawingContext(), ctx => {
          ctx.drawImage(img, 0, 0);
        });

        (URL || webkitURL).revokeObjectURL(url);
        resolve(result);
      };

      // On error, return an exception via the Promise
      img.onerror = err => {
        (URL || webkitURL).revokeObjectURL(url);
        reject(err);
      };
    });
  }
}
