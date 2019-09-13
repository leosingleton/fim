// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvasBase, FimDefaultOffscreenCanvasFactory } from './FimCanvasBase';
import { FimRgbaBuffer } from './FimRgbaBuffer';
import { IFimGetSetPixel } from './IFimGetSetPixel';
import { FimObjectType, recordCreate, recordDispose } from '../debug/FimStats';
import { FimGLCanvas } from '../gl/FimGLCanvas';
import { FimColor } from '../primitives/FimColor';
import { FimRect } from '../primitives/FimRect';
import { using, IDisposable, DisposableSet } from '@leosingleton/commonlibs';

/** An image consisting of an invisible HTML canvas on the DOM */
export class FimCanvas extends FimCanvasBase implements IFimGetSetPixel {
  /**
   * Creates an invisible canvas in the DOM
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   * @param offscreenCanvasFactory If provided, this function is used to instantiate an OffscreenCanvas object. If
   *    null or undefined, we create a canvas on the DOM instead. The default value checks the browser's capabilities,
   *    and uses Chrome's OffscreenCanvas functionality if supported.
   */
  public constructor(width: number, height: number, initialColor?: FimColor | string,
    offscreenCanvasFactory = FimCanvasBase.supportsOffscreenCanvas ? FimDefaultOffscreenCanvasFactory : null) {
    super(width, height, offscreenCanvasFactory);

    // Report telemetry for debugging
    recordCreate(this, this.offscreenCanvas ? FimObjectType.OffscreenCanvas : FimObjectType.Canvas2D, null, 4, 8);

    if (initialColor) {
      this.fillCanvas(initialColor);
    }
  }

  public dispose(): void {
    // Report telemetry for debugging
    recordDispose(this, this.offscreenCanvas ? FimObjectType.OffscreenCanvas : FimObjectType.Canvas2D);

    super.dispose();
  }

  /** Creates a new FimCanvas which is a duplicate of this one */
  public duplicateCanvas(): FimCanvas {
    let dupe = new FimCanvas(this.imageDimensions.w, this.imageDimensions.h);
    dupe.copyFromCanvas(this, this.imageDimensions, this.imageDimensions);
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
    return FimCanvasBase.createDrawingContext(this.canvasElement, imageSmoothingEnabled, operation, alpha);
  }

  /** Fills the canvas with a solid color */
  public fillCanvas(color: FimColor | string): void {
    FimCanvasBase.fillCanvas(this.getCanvas(), color);
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
    if (srcImage instanceof FimCanvas || srcImage instanceof FimGLCanvas) {
      this.copyFromCanvas(srcImage, srcCoords, destCoords);
    } else if (srcImage instanceof FimRgbaBuffer) {
      this.copyFromRgbaBuffer(srcImage, srcCoords, destCoords);
    } else {
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
    if (srcImage instanceof FimCanvas || srcImage instanceof FimGLCanvas) {
      this.copyFromCanvas(srcImage, srcCoords, destCoords);
    } else if (srcImage instanceof FimRgbaBuffer) {
      // According to https://stackoverflow.com/questions/7721898/is-putimagedata-faster-than-drawimage/7722892,
      // drawImage() is faster than putImageData() on most browsers. Plus, it supports cropping and rescaling.
      // In addition, on Chrome 72, the pixel data was being slightly changed by putImageData() and breaking unit
      // tests. However, createImageBitmap() is not yet supported on Safari or Edge.
      if (typeof createImageBitmap !== 'undefined') {
        return this.copyFromRgbaBufferWithImageBitmapAsync(srcImage, srcCoords, destCoords);
      }
      this.copyFromRgbaBuffer(srcImage, srcCoords, destCoords);
    } else {
      this.throwOnInvalidImageKind(srcImage);
    }
  }

  protected copyFromCanvas(srcImage: FimCanvas | FimGLCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || srcImage.imageDimensions;
    destCoords = destCoords || this.imageDimensions;

    // Scale the coordinates
    srcCoords = srcCoords.rescale(srcImage.downscaleRatio);
    destCoords = destCoords.rescale(this.downscaleRatio);

    // Copy the canvas
    FimCanvasBase.copyCanvasToCanvas(srcImage.getCanvas(), this.canvasElement, srcCoords, destCoords);
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
  protected async copyFromRgbaBufferWithImageBitmapAsync(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?:
      FimRect): Promise<void> {
    // Default parameters
    srcCoords = srcCoords || srcImage.imageDimensions;
    destCoords = destCoords || this.imageDimensions;

    // Scale the coordinates
    srcCoords = srcCoords.rescale(srcImage.downscaleRatio);
    destCoords = destCoords.rescale(this.downscaleRatio);
    
    // Enable image smoothing if we are rescaling the image
    let imageSmoothingEnabled = !srcCoords.sameDimensions(destCoords);

    await DisposableSet.usingAsync(async disposable => {
      let ctx = disposable.addDisposable(this.createDrawingContext(imageSmoothingEnabled));

      let imageData = new ImageData(srcImage.getBuffer(), srcImage.realDimensions.w, srcImage.realDimensions.h);
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
    srcCoords = srcCoords || srcImage.imageDimensions;
    destCoords = destCoords || this.imageDimensions;
    
    // Scale the coordinates
    srcCoords = srcCoords.rescale(srcImage.downscaleRatio);
    destCoords = destCoords.rescale(this.downscaleRatio);
    
    if (srcCoords.equals(srcImage.imageDimensions) && srcCoords.sameDimensions(destCoords)) {
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
   * FimCanvas and HtmlCanvasElement destinations support both cropping and rescaling, while FimRgbaBuffer destinations
   * only support cropping.
   * 
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyTo(destImage: FimCanvas | FimRgbaBuffer | HTMLCanvasElement, srcCoords?: FimRect,
      destCoords?: FimRect): void {
    if (destImage instanceof FimCanvas || destImage instanceof FimRgbaBuffer) {
      destImage.copyFrom(this, srcCoords, destCoords);
    } else {
      this.toHtmlCanvas(destImage, srcCoords, destCoords);
    }
  }

  public getPixel(x: number, y: number): FimColor {
    let pixel: Uint8ClampedArray;

    // Scale the coordinates
    x *= Math.round(this.downscaleRatio);
    y *= Math.round(this.downscaleRatio);
    
    using(new FimRgbaBuffer(1, 1), buffer => {
      buffer.copyFrom(this, FimRect.fromXYWidthHeight(x, y, 1, 1));
      pixel = buffer.getBuffer();
    });

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }

  public setPixel(x: number, y: number, color: FimColor): void {
    // Scale the coordinates
    x *= Math.round(this.downscaleRatio);
    y *= Math.round(this.downscaleRatio);

    using(new FimRgbaBuffer(1, 1, color), buffer => {
      this.copyFromRgbaBuffer(buffer, buffer.imageDimensions, FimRect.fromXYWidthHeight(x, y, 1, 1));
    });
  }

  /**
   * Creates a FimCanvas from a JPEG file
   * @param jpegFile JPEG file, loaded into a byte array
   * @param offscreenCanvasFactory If provided, this function is used to instantiate an OffscreenCanvas object. If
   *    null or undefined, we create a canvas on the DOM instead. The default value checks the browser's capabilities,
   *    and uses Chrome's OffscreenCanvas functionality if supported.
   */
  public static createFromJpeg(jpegFile: Uint8Array, offscreenCanvasFactory = FimCanvasBase.supportsOffscreenCanvas ?
      FimDefaultOffscreenCanvasFactory : null): Promise<FimCanvas> {
    // Create a Blob holding the binary data and load it onto an HTMLImageElement
    let blob = new Blob([jpegFile], { type: 'image/jpeg' });
    return FimCanvas.createFromImageBlob(blob, offscreenCanvasFactory);
  }

  /**
   * Creates a FimCanvas from a Blob containing an image
   * @param blob Blob of type 'image/*'
   * @param offscreenCanvasFactory If provided, this function is used to instantiate an OffscreenCanvas object. If
   *    null or undefined, we create a canvas on the DOM instead. The default value checks the browser's capabilities,
   *    and uses Chrome's OffscreenCanvas functionality if supported.
   */
  public static async createFromImageBlob(blob: Blob, offscreenCanvasFactory = FimCanvasBase.supportsOffscreenCanvas ?
      FimDefaultOffscreenCanvasFactory : null): Promise<FimCanvas> {
    return new Promise((resolve, reject) => {
      let url = (URL || webkitURL).createObjectURL(blob);
      let img = new Image();
      img.src = url;

      // On success, copy the image to a FimCanvas and return it via the Promise
      img.onload = () => {
        let result = new FimCanvas(img.width, img.height, undefined, offscreenCanvasFactory);
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

/** Internal version of the class only for unit testing */
export class InternalFimCanvas extends FimCanvas {
  public internalCopyFromRgbaBufferWithImageBitmapAsync(srcImage: FimRgbaBuffer, srcCoords?: FimRect,
      destCoords?: FimRect): Promise<void> {
    return this.copyFromRgbaBufferWithImageBitmapAsync(srcImage, srcCoords, destCoords);
  }
}
