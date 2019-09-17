// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage, IFimImage } from './FimImage';
import { IFimCanvas } from './FimCanvas';
import { IFim } from '../Fim';
import { FimConfig } from '../debug/FimConfig';
import { recordDrawImage } from '../debug/FimStats';
import { FimColor } from '../primitives/FimColor';
import { FimRect } from '../primitives/FimRect';
import { IDisposable, makeDisposable, using } from '@leosingleton/commonlibs';

/**
 * Factory method to create OffscreenCanvas objects. These could be Chrome's OffscreenCanvas support, or a mock object
 * to support NodeJS or other platforms.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @returns OffscreenCanvas object
 */
export type FimOffscreenCanvasFactory = (width: number, height: number) => OffscreenCanvas;

/**
 * Constructs an OffscreenCanvas using Chrome's implementation. Be sure to check FimCanvasBase.supportsOffscreenCanvas
 * before calling this function.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @returns OffscreenCanvas object
 */
export function FimDefaultOffscreenCanvasFactory(width: number, height: number): OffscreenCanvas {
  // Use Chrome's OffscreenCanvas object
  if (!FimCanvasBase.supportsOffscreenCanvas) {
    // The browser does not support OffscreenCanvas
    throw new Error('No OffScreenCanvas');
  }

  // uglify-js is not yet aware of OffscreenCanvas and name mangles it
  // @nomangle OffscreenCanvas convertToBlob
  return new OffscreenCanvas(width, height);
}

export interface IFimCanvasBase extends IFimImage {
  /** Returns the underlying HTMLCanvasElement or OffscreenCanvas */
  getCanvas(): HTMLCanvasElement | OffscreenCanvas;

  /** Creates a new canvas which is a duplicate of this one */
  duplicateCanvas(): IFimCanvas;

  /** Fills the canvas with a solid color */
  fillCanvas(color: FimColor | string): void;

  /**
   * Exports the canvas to a PNG file
   * @returns Array containing PNG data
   */
  toPng(): Promise<Uint8Array>;

  /**
   * Exports the canvas to a JPEG file
   * @param quality JPEG quality, 0 to 1
   * @returns Array containing JPEG data
   */
  toJpeg(quality?: number): Promise<Uint8Array>;
}

/** Base class for FimCanvas and FimGLCanvas. They both share the same underlying hidden canvas on the DOM. */
export abstract class FimCanvasBase extends FimImage implements IFimCanvasBase {
  /**
   * Creates an invisible canvas in the DOM
   * @param fim FIM canvas factory
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param offscreenCanvasFactory If provided, this function is used to instantiate an OffscreenCanvas object. If
   *    null or undefined, we create a canvas on the DOM instead. The default value checks the browser's capabilities,
   *    and uses Chrome's OffscreenCanvas functionality if supported.
   * @param maxDimension WebGL framebuffers have maximum sizes, which can be as low as 2048x2048. If the canvas width
   *    or height exceeds this, the image will be automatically downscaled.
   */
  public constructor(fim: IFim, width: number, height: number, offscreenCanvasFactory = FimCanvasBase.supportsOffscreenCanvas ?
      FimDefaultOffscreenCanvasFactory : null, maxDimension = 0) {
    // Call the parent constructor. Read the new dimensions as they may get downscaled.
    super(fim, width, height, maxDimension);
    let realDimensions = this.realDimensions;

    // We have an option to disable offscreen canvas support via the query string. This can be useful for debugging,
    // since regular canvases can be made visible in the browser's debugging tools.
    let enableOC = FimConfig.config.enableOffscreenCanvas;

    let useOffscreenCanvas = (offscreenCanvasFactory !== null) && enableOC;
    if (useOffscreenCanvas) {
      this.canvasElement = offscreenCanvasFactory(realDimensions.w, realDimensions.h);
    } else {
      // Create a hidden canvas
      let canvas = document.createElement('canvas');
      canvas.width = realDimensions.w;
      canvas.height = realDimensions.h;
      canvas.style.display = 'none';
      canvas.id = `fim${this.imageId}`;
      document.body.appendChild(canvas);
      this.canvasElement = canvas;
    }

    this.offscreenCanvas = useOffscreenCanvas;
    this.offscreenCanvasFactory = useOffscreenCanvas ? offscreenCanvasFactory : null;
  }

  /** Returns the underlying HTMLCanvasElement or OffscreenCanvas */
  public getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvasElement;
  }
  protected canvasElement: HTMLCanvasElement | OffscreenCanvas;

  public dispose(): void {
    if (this.canvasElement) {
      if (!this.offscreenCanvas) {
        document.body.removeChild(this.canvasElement as HTMLCanvasElement);
      }
      delete this.canvasElement;
    }
  }

  /** True if this object is backed by an OffscreenCanvas; false for a standard 2D canvas */
  public readonly offscreenCanvas: boolean;

  /** If offscreenCanvas is true, a reference to the factory object used to create the canvas */
  public readonly offscreenCanvasFactory: FimOffscreenCanvasFactory;

  // IFimCanvasBase implementation
  public abstract duplicateCanvas(): IFimCanvas;
  public abstract fillCanvas(color: FimColor | string): void;

  /**
   * Exports the canvas to a PNG file
   * @returns Blob containing PNG data
   */
  public async toPngBlob(): Promise<Blob> {
    if (!this.offscreenCanvas) {
      let canvas = this.canvasElement as HTMLCanvasElement;
      return new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob));
      });
    } else {
      let canvas = this.canvasElement as OffscreenCanvas;
      return canvas.convertToBlob({});
    }
  }

  public async toPng(): Promise<Uint8Array> {
    let blob = await this.toPngBlob();
    let buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Exports the canvas to a JPEG file
   * @param quality JPEG quality, 0 to 1
   * @returns Blob containing JPEG data
   */
  public async toJpegBlob(quality = 0.95): Promise<Blob> {
    if (!this.offscreenCanvas) {
      let canvas = this.canvasElement as HTMLCanvasElement;
      return new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
      });
    } else {
      let canvas = this.canvasElement as OffscreenCanvas;
      return canvas.convertToBlob({ type: 'image/jpeg', quality: quality });
    }
  }

  public async toJpeg(quality = 0.95): Promise<Uint8Array> {
    let blob = await this.toJpegBlob(quality);
    let buffer = await new Response(blob).arrayBuffer();
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

  /** Determines whether the current browser supports offscreen canvases */
  public static readonly supportsOffscreenCanvas = (typeof OffscreenCanvas !== 'undefined');

  /**
   * Helper function to construct a drawing context
   * @param destCanvas HTML or offscreen canvas to create drawing context of
   * @param imageSmoothingEnabled Enables image smoothing
   * @param operation CanvasRenderingContext2D.globalCompositeOperation value, e.g. 'copy' or 'source-over'
   * @param alpha CanvasRenderingContext2D.alpha value, where 0 = transparent and 1 = opaque
   */
  protected static createDrawingContext(destCanvas: HTMLCanvasElement | OffscreenCanvas, imageSmoothingEnabled = false,
      operation = 'copy', alpha = 1): CanvasRenderingContext2D & IDisposable {
    let ctx = (destCanvas as HTMLCanvasElement).getContext('2d');
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
   * Helper function to copy one canvas to another
   * @param srcCanvas Source canvas
   * @param destCanvas Destination canvas
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  protected static copyCanvasToCanvas(srcCanvas: HTMLCanvasElement | OffscreenCanvas,
      destCanvas: HTMLCanvasElement | OffscreenCanvas, srcCoords: FimRect, destCoords: FimRect): void {
    // copy is slightly faster than source-over
    let op = (destCoords.w === destCanvas.width && destCoords.h === destCanvas.height) ? 'copy' : 'source-over';

    // Enable image smoothing if we are rescaling the image
    let imageSmoothingEnabled = !srcCoords.sameDimensions(destCoords);

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
    let colorString = (typeof(color) === 'string') ? color : color.string;

    using(this.createDrawingContext(destCanvas, false, 'copy', 1), ctx => {
      ctx.fillStyle = colorString;
      ctx.fillRect(0, 0, destCanvas.width, destCanvas.height);
    });
  }
}
