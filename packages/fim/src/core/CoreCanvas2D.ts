// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { ImageSource } from './types/ImageSource';
import { RenderingContext2D } from './types/RenderingContext2D';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';
import { DisposableSet, IDisposable, makeDisposable, using, usingAsync } from '@leosingleton/commonlibs';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvas2D extends CoreCanvas {
  /** Returns the 2D rendering context for the canvas */
  public getContext(): RenderingContext2D {
    const me = this;
    if (!me.renderingContext) {
      me.renderingContext = this.createContext();
      if (!me.renderingContext) {
        // Safari on iOS has a limit of 288 MB total for all canvases on a page. It logs this message to the console if
        // connecting to a PC for debugging, but the only error given to the JavaScript code is returning a null on
        // getContext('2d'). This is most likely the cause of null here.
        throw new FimError(FimErrorCode.OutOfMemory);
      }
    }

    return me.renderingContext;
  }

  /** Cached rendering context */
  private renderingContext: RenderingContext2D;

  /** Derived classes must override this method to call canvas.getContext('2d') */
  protected abstract createContext(): RenderingContext2D;

  /**
   * Helper function to construct a 2D drawing context
   * @param destCanvas HTML or offscreen canvas to create drawing context of
   * @param imageSmoothingEnabled Enables image smoothing
   * @param operation CanvasRenderingContext2D.globalCompositeOperation value, e.g. 'copy' or 'source-over'
   * @param alpha CanvasRenderingContext2D.alpha value, where 0 = transparent and 1 = opaque
   */
  public createDrawingContext(imageSmoothingEnabled = false, operation = 'copy', alpha = 1):
      RenderingContext2D & IDisposable {
    this.ensureNotDisposed();

    const ctx = this.getContext();
    ctx.save();
    ctx.globalCompositeOperation = operation;
    ctx.globalAlpha = alpha;

    // Disable image smoothing in most common browsers. Still an experimental feature, so TypeScript doesn't seem to
    // support it well...
    // @nomangle imageSmoothingEnabled mozImageSmoothingEnabled webkitImageSmoothingEnabled msImageSmoothingEnabled
    const ctxAny = ctx as any;
    ctx.imageSmoothingEnabled = imageSmoothingEnabled;
    ctxAny.mozImageSmoothingEnabled = imageSmoothingEnabled;
    ctxAny.webkitImageSmoothingEnabled = imageSmoothingEnabled;
    ctxAny.msImageSmoothingEnabled = imageSmoothingEnabled;

    return makeDisposable(ctx, ctx => ctx.restore());
  }

  public fillSolid(color: FimColor | string): void {
    const me = this;
    me.ensureNotDisposed();

    // Force color to be a string
    const colorString = (typeof(color) === 'string') ? color : color.string;

    using(me.createDrawingContext(), ctx => {
      ctx.fillStyle = colorString;
      ctx.fillRect(0, 0, me.canvasDimensions.w, me.canvasDimensions.h);
    });

    me.hasImage = true;
  }

  public getPixel(point: FimPoint): FimColor {
    const me = this;
    let result: FimColor;
    point = point.toFloor();

    me.ensureNotDisposedAndHasImage();
    me.validateCoordinates(point);

    using(me.createDrawingContext(), ctx => {
      const imgData = ctx.getImageData(point.x, point.y, 1, 1);
      const data = imgData.data;
      result = FimColor.fromRGBABytes(data[0], data[1], data[2], data[3]);
    });

    return result;
  }

  /**
   * Loads the image contents from RGBA data
   * @param pixelData An array containing 4 bytes per pixel, in RGBA order
   * @param dimensions Optional dimensions of `pixelData`. If not provided, it is assumed to be the same dimensions as
   *    the canvas. If provided, the dimensions may be different from the canvas, in which case the image contents will
   *    be automatically rescaled. If not provided, then `pixelData` must be the same dimensions as the canvas.
   */
  public async loadPixelDataAsync(pixelData: Uint8ClampedArray, dimensions?: FimDimensions): Promise<void> {
    const me = this;
    me.ensureNotDisposed();

    // Validate the array size matches the expected dimensions
    dimensions = dimensions ?? me.canvasDimensions;
    const sameDimensions = dimensions.equals(me.canvasDimensions);
    const expectedLength = dimensions.getArea() * 4;
    if (pixelData.length !== expectedLength) {
      FimError.throwOnInvalidDimensions(dimensions, pixelData.length);
    }

    if (!me.engineOptions.disableImageBitmap) {
      // According to https://stackoverflow.com/questions/7721898/is-putimagedata-faster-than-drawimage/7722892,
      // drawImage() is faster than putImageData() on most browsers. Plus, it supports cropping and rescaling.
      // In addition, on Chrome 72, the pixel data was being slightly changed by putImageData() and breaking unit
      // tests. However, createImageBitmap() is not yet supported on Safari or Edge.
      await DisposableSet.usingAsync(async disposable => {
        // Enable image smoothing if we are rescaling the image
        const ctx = disposable.addDisposable(this.createDrawingContext(!sameDimensions));

        const imageData = new ImageData(pixelData, dimensions.w, dimensions.h);
        const imageBitmap = disposable.addNonDisposable(await createImageBitmap(imageData), ib => ib.close());

        ctx.drawImage(imageBitmap, 0, 0, dimensions.w, dimensions.h, 0, 0, me.canvasDimensions.w,
          me.canvasDimensions.h);
      });
    } else if (dimensions.equals(me.canvasDimensions)) {
      // This implementation is slightly slower than the drawImage() one above, but has better browser compatibility
      using(me.createDrawingContext(), ctx => {
        const imgData = ctx.createImageData(dimensions.w, dimensions.h);
        imgData.data.set(pixelData);
        ctx.putImageData(imgData, 0, 0);
      });
    } else {
      // Really slow case: Cropping or rescaling is required. Render to a temporary canvas, then copy.
      await usingAsync(me.createTemporaryCanvas2D({ downscale: 1 }, dimensions), async temp => {
        await temp.loadPixelDataAsync(pixelData, dimensions);
        await me.copyFromAsync(temp);
      });
    }

    me.hasImage = true;
  }

  /**
   * Loads the image contents from an Image
   * @param image Image object. The caller is responsible for first waiting for the `onload` event of the image before
   *    calling this function.
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  public loadFromImage(image: ImageSource, allowRescale = false): void {
    const me = this;
    me.ensureNotDisposed();

    // Validate the dimensions
    const imageDimensions = FimDimensions.fromWidthHeight(image.width, image.height);
    let sameDimensions = true;
    if (!imageDimensions.equals(me.canvasDimensions)) {
      if (allowRescale) {
        sameDimensions = false;
      } else {
        FimError.throwOnInvalidDimensions(me.canvasDimensions, imageDimensions);
      }
    }

    // Enable image smoothing if we are rescaling the image
    using(me.createDrawingContext(!sameDimensions), ctx => {
      ctx.drawImage(image as CanvasImageSource, 0, 0, imageDimensions.w, imageDimensions.h, 0, 0, me.canvasDimensions.w,
        me.canvasDimensions.h);
    });

    me.hasImage = true;
  }

  /**
   * Loads the image contents from a PNG file
   * @param pngFile PNG file, as a Uint8Array
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  public abstract loadFromPngAsync(pngFile: Uint8Array, allowRescale?: boolean): Promise<void>;

  /**
   * Loads the image contents from a JPEG file
   * @param jpegFile JPEG file, as a Uint8Array
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  public abstract loadFromJpegAsync(jpegFile: Uint8Array, allowRescale?: boolean): Promise<void>;

  /**
   * Copies contents from another canvas. Supports both cropping and rescaling.
   * @param srcCanvas Source canvas
   * @param srcCoords Coordinates of source canvas to copy from
   * @param destCoords Coordinates of destination canvas to copy to
   */
  public async copyFromAsync(srcCanvas: CoreCanvas, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    const me = this;
    me.ensureNotDisposed();
    srcCanvas.ensureNotDisposedAndHasImage();

    // Default parameters
    srcCoords = (srcCoords ?? FimRect.fromDimensions(srcCanvas.canvasDimensions)).toFloor();
    destCoords = (destCoords ?? FimRect.fromDimensions(me.canvasDimensions)).toFloor();

    srcCanvas.validateRect(srcCoords);
    me.validateRect(destCoords);

    // copy is slightly faster than source-over
    const op = (destCoords.dim.equals(me.canvasDimensions)) ? 'copy' : 'source-over';

    // Enable image smoothing if we are rescaling the image
    const imageSmoothingEnabled = !srcCoords.sameDimensions(destCoords);

    // Report telemetry for debugging
    //recordDrawImage(srcCoords, destCoords, op, imageSmoothingEnabled);

    using(me.createDrawingContext(imageSmoothingEnabled, op, 1), ctx => {
      ctx.drawImage(srcCanvas.getImageSource(), srcCoords.xLeft, srcCoords.yTop, srcCoords.dim.w, srcCoords.dim.h,
        destCoords.xLeft, destCoords.yTop, destCoords.dim.w, destCoords.dim.h);
    });

    me.hasImage = true;
  }

  public exportToPixelData(srcCoords?: FimRect): Uint8ClampedArray {
    const me = this;
    me.ensureNotDisposedAndHasImage();

    // Default parameter
    srcCoords = srcCoords ?? FimRect.fromDimensions(me.canvasDimensions);
    me.validateRect(srcCoords);

    let result: Uint8ClampedArray;
    using(me.createDrawingContext(), ctx => {
      const imgData = ctx.getImageData(srcCoords.xLeft, srcCoords.yTop, srcCoords.dim.w, srcCoords.dim.h);
      result = imgData.data;
    });

    return result;
  }

  /**
   * Exports the canvas contents to a PNG file
   * @returns Compressed PNG file as a Uint8Array
   */
  public abstract exportToPngAsync(): Promise<Uint8Array>;

  /**
   * Exports the canvas contents to a JPEG file
   * @param quality Optional compression quality (0.0 to 1.0)
   * @returns Compressed JPEG file as a Uint8Array
   */
  public abstract exportToJpegAsync(quality: number): Promise<Uint8Array>;
}
