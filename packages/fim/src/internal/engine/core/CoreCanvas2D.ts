// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { RenderingContext2D } from './types/RenderingContext2D';
import { FimColor } from '../../../primitives/FimColor';
import { FimError, FimErrorCode } from '../../../primitives/FimError';
import { FimPoint } from '../../../primitives/FimPoint';
import { FimRect } from '../../../primitives/FimRect';
import { makeDisposable, IDisposable, using } from '@leosingleton/commonlibs';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvas2D extends CoreCanvas {
  /** Derived classes must override this method to call canvas.getContext('2d') */
  protected abstract getContext(): RenderingContext2D;

  /**
   * Helper function to construct a 2D drawing context
   * @param destCanvas HTML or offscreen canvas to create drawing context of
   * @param imageSmoothingEnabled Enables image smoothing
   * @param operation CanvasRenderingContext2D.globalCompositeOperation value, e.g. 'copy' or 'source-over'
   * @param alpha CanvasRenderingContext2D.alpha value, where 0 = transparent and 1 = opaque
   */
  public createDrawingContext(imageSmoothingEnabled = false, operation = 'copy', alpha = 1):
      RenderingContext2D & IDisposable {
    const ctx = this.getContext();
    if (!ctx) {
      // Safari on iOS has a limit of 288 MB total for all canvases on a page. It logs this message to the console if
      // connecting to a PC for debugging, but the only errror given to the JavaScript code is returning a null on
      // getContext('2d'). This is most likely the cause of null here.
      throw new FimError(FimErrorCode.OutOfMemory);
    }

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

  public fillCanvas(color: FimColor | string): void {
    // Force color to be a string
    const colorString = (typeof(color) === 'string') ? color : color.string;

    using(this.createDrawingContext(), ctx => {
      ctx.fillStyle = colorString;
      ctx.fillRect(0, 0, this.canvasDimensions.w, this.canvasDimensions.h);
    });
  }

  public getPixel(x: number, y: number): FimColor {
    let result: FimColor;
    const point = FimPoint.fromXY(x, y).toFloor();
    this.validateCoordinates(point);

    using(this.createDrawingContext(), ctx => {
      const imgData = ctx.getImageData(point.x, point.y, 1, 1);
      const data = imgData.data;
      result = FimColor.fromRGBABytes(data[0], data[1], data[2], data[3]);
    });

    return result;
  }

  /**
   * Sets the pixel color at the specified coordinate
   * @param x X-coordinate, in pixels
   * @param y Y-coordinate, in pixels
   * @param color Pixel color
   */
  public setPixel(x: number, y: number, color: FimColor): void {
    const point = FimPoint.fromXY(x, y).toFloor();
    this.validateCoordinates(point);

    using(this.createDrawingContext(), ctx => {
      const imgData = ctx.createImageData(1, 1);
      const data = imgData.data;
      data[0] = color.r;
      data[1] = color.g;
      data[2] = color.b;
      data[3] = color.a;
      ctx.putImageData(imgData, point.x, point.y);
    });
  }

  /**
   * Copies contents from another canvas. All inputs supports both cropping and rescaling.
   * @param srcCanvas Source canvas
   * @param srcCoords Coordinates of source canvas to copy from
   * @param destCoords Coordinates of destination canvas to copy to
   */
  public copyFrom(srcCanvas: CoreCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    // Default parameters
    srcCoords = (srcCoords ?? FimRect.fromDimensions(srcCanvas.canvasDimensions)).toFloor();
    destCoords = (destCoords ?? FimRect.fromDimensions(this.canvasDimensions)).toFloor();

    srcCanvas.validateRect(srcCoords);
    this.validateRect(destCoords);

    // copy is slightly faster than source-over
    const op = (destCoords.dim.equals(this.canvasDimensions)) ? 'copy' : 'source-over';

    // Enable image smoothing if we are rescaling the image
    const imageSmoothingEnabled = !srcCoords.sameDimensions(destCoords);

    // Report telemetry for debugging
    //recordDrawImage(srcCoords, destCoords, op, imageSmoothingEnabled);

    using(this.createDrawingContext(imageSmoothingEnabled, op, 1), ctx => {
      ctx.drawImage(srcCanvas.getImageSource(), srcCoords.xLeft, srcCoords.yTop, srcCoords.dim.w, srcCoords.dim.h,
        destCoords.xLeft, destCoords.yTop, destCoords.dim.w, destCoords.dim.h);
    });
  }
}
