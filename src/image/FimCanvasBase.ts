// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';
import { FimCanvas } from './FimCanvas';
import { FimDomCanvasFactory, FimCanvasType } from './FimCanvasFactory';
import { FimError, FimErrorCode } from './FimError';
import { Fim } from '../Fim';
import { recordDrawImage } from '../debug/FimStats';
import { FimColor } from '../primitives/FimColor';
import { FimRect } from '../primitives/FimRect';
import { IDisposable, makeDisposable, using } from '@leosingleton/commonlibs';

/** Base class for FimCanvas and FimGLCanvas. They both share the same underlying hidden canvas on the DOM. */
export abstract class FimCanvasBase extends FimImage {
  /**
   * Creates an invisible canvas in the DOM
   * @param fim FIM canvas factory
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param canvasType Type of the canvas, either 2D or WebGL
   * @param maxDimension WebGL framebuffers have maximum sizes, which can be as low as 2048x2048. If the canvas width
   *    or height exceeds this, the image will be automatically downscaled.
   */
  public constructor(fim: Fim, width: number, height: number, canvasType: FimCanvasType, maxDimension = 0) {
    // Call the parent constructor. Read the new dimensions as they may get downscaled.
    super(fim, width, height, maxDimension);

    const realDimensions = this.realDimensions;
    const canvasFactory = fim.canvasFactory;
    this.canvasElement = canvasFactory(realDimensions.w, realDimensions.h, canvasType, `fim${this.imageId}`);
    this.offscreenCanvas = canvasFactory !== FimDomCanvasFactory;
  }

  /** Returns the underlying HTMLCanvasElement or OffscreenCanvas */
  public getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvasElement;
  }
  protected canvasElement: (HTMLCanvasElement | OffscreenCanvas) & IDisposable;

  public dispose(): void {
    if (this.canvasElement) {
      this.canvasElement.dispose();
      delete this.canvasElement;
    }
  }

  /** True if this object is backed by an OffscreenCanvas; false for a standard 2D canvas */
  public readonly offscreenCanvas: boolean;

  /** Creates a new canvas which is a duplicate of this one */
  public abstract duplicateCanvas(): FimCanvas;

  /** Fills the canvas with a solid color */
  public abstract fillCanvas(color: FimColor | string): void;

  /**
   * Exports the canvas to a PNG file
   * @returns Blob containing PNG data
   */
  public async toPngBlob(): Promise<Blob> {
    if (!this.offscreenCanvas) {
      const canvas = this.canvasElement as HTMLCanvasElement;
      return new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob));
      });
    } else {
      const canvas = this.canvasElement as OffscreenCanvas;
      return canvas.convertToBlob({});
    }
  }

  /**
   * Exports the canvas to a PNG file
   * @returns Array containing PNG data
   */
  public async toPng(): Promise<Uint8Array> {
    const blob = await this.toPngBlob();
    const buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Exports the canvas to a JPEG file
   * @param quality JPEG quality, 0 to 1
   * @returns Blob containing JPEG data
   */
  public async toJpegBlob(quality = 0.95): Promise<Blob> {
    if (!this.offscreenCanvas) {
      const canvas = this.canvasElement as HTMLCanvasElement;
      return new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
      });
    } else {
      const canvas = this.canvasElement as OffscreenCanvas;
      return canvas.convertToBlob({ type: 'image/jpeg', quality });
    }
  }

  /**
   * Exports the canvas to a JPEG file
   * @param quality JPEG quality, 0 to 1
   * @returns Array containing JPEG data
   */
  public async toJpeg(quality = 0.95): Promise<Uint8Array> {
    const blob = await this.toJpegBlob(quality);
    const buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Copies image to an HTML canvas. Supports both cropping and rescaling.
   * @param destImage Destination HTML canvas
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public toHtmlCanvas(destCanvas: HTMLCanvasElement | OffscreenCanvas, srcCoords?: FimRect,
      destCoords?: FimRect): void {
    // Default parameters
    srcCoords = srcCoords || this.imageDimensions;
    destCoords = destCoords || FimRect.fromWidthHeight(destCanvas.width, destCanvas.height);

    // Scale the coordinates
    srcCoords = srcCoords.rescale(this.downscaleRatio);

    // Copy the canvas
    FimCanvasBase.copyCanvasToCanvas(this.getCanvas(), destCanvas, srcCoords, destCoords);
  }

  /**
   * Helper function to construct a drawing context
   * @param destCanvas HTML or offscreen canvas to create drawing context of
   * @param imageSmoothingEnabled Enables image smoothing
   * @param operation CanvasRenderingContext2D.globalCompositeOperation value, e.g. 'copy' or 'source-over'
   * @param alpha CanvasRenderingContext2D.alpha value, where 0 = transparent and 1 = opaque
   */
  protected static createDrawingContext(destCanvas: HTMLCanvasElement | OffscreenCanvas, imageSmoothingEnabled = false,
      operation = 'copy', alpha = 1): CanvasRenderingContext2D & IDisposable {
    const ctx = (destCanvas as HTMLCanvasElement).getContext('2d');
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
    ctxAny['imageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['mozImageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['webkitImageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['msImageSmoothingEnabled'] = imageSmoothingEnabled;

    return makeDisposable(ctx, ctx => ctx.restore());
  }

  /**
   * Helper function to copy one canvas to another
   * @param srcCanvas Source canvas
   * @param destCanvas Destination canvas
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  protected static copyCanvasToCanvas(srcCanvas: HTMLCanvasElement | OffscreenCanvas,
      destCanvas: HTMLCanvasElement | OffscreenCanvas, srcCoords: FimRect, destCoords: FimRect): void {
    // copy is slightly faster than source-over
    const op = (destCoords.w === destCanvas.width && destCoords.h === destCanvas.height) ? 'copy' : 'source-over';

    // Enable image smoothing if we are rescaling the image
    const imageSmoothingEnabled = !srcCoords.sameDimensions(destCoords);

    // Report telemetry for debugging
    recordDrawImage(srcCoords, destCoords, op, imageSmoothingEnabled);

    using(this.createDrawingContext(destCanvas, imageSmoothingEnabled, op, 1), ctx => {
      ctx.drawImage(srcCanvas as HTMLCanvasElement, srcCoords.xLeft, srcCoords.yTop, srcCoords.w, srcCoords.h,
        destCoords.xLeft, destCoords.yTop, destCoords.w, destCoords.h);
    });
  }

  /**
   * Helper function to fill a canvas with a solid color
   * @param destCanvas Destination canvas
   * @param color Fill color
   */
  protected static fillCanvas(destCanvas: HTMLCanvasElement | OffscreenCanvas, color: FimColor | string): void {
    // Force color to be a string
    const colorString = (typeof(color) === 'string') ? color : color.string;

    using(this.createDrawingContext(destCanvas, false, 'copy', 1), ctx => {
      ctx.fillStyle = colorString;
      ctx.fillRect(0, 0, destCanvas.width, destCanvas.height);
    });
  }
}
