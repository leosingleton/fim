// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { RenderingContext2D } from './types/RenderingContext2D';
import { FimColor } from '../../../primitives/FimColor';
import { FimError, FimErrorCode } from '../../../primitives/FimError';
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

  /**
   * Helper function to fill a canvas with a solid color
   * @param color Fill color
   */
  public fillCanvas(color: FimColor | string): void {
    // Force color to be a string
    const colorString = (typeof(color) === 'string') ? color : color.string;

    using(this.createDrawingContext(), ctx => {
      ctx.fillStyle = colorString;
      ctx.fillRect(0, 0, this.canvasDimensions.w, this.canvasDimensions.h);
    });
  }

  /**
   * Gets the pixel color at the specified coordinate
   * @param x X-coordinate, in pixels
   * @param y Y-coordinate, in pixels
   * @returns Pixel color
   */
  public getPixel(x: number, y: number): FimColor {
    let result: FimColor;

    using(this.createDrawingContext(), ctx => {
      const imgData = ctx.getImageData(x, y, 1, 1);
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
    using(this.createDrawingContext(), ctx => {
      const imgData = ctx.createImageData(1, 1);
      const data = imgData.data;
      data[0] = color.r;
      data[1] = color.g;
      data[2] = color.b;
      data[3] = color.a;
      ctx.putImageData(imgData, x, y);
    });
  }
}
