// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreNodeCanvasWebGL } from './CoreNodeCanvasWebGL';
import { loadFromFileAsync } from './ImageLoader';
import { usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions, FimEngineOptions, FimError, FimRect } from '@leosingleton/fim';
import { CoreCanvas, CoreCanvas2D, CoreCanvasOptions, CoreMimeType,
  RenderingContext2D } from '@leosingleton/fim/internals';
import { Canvas, createCanvas } from 'canvas';

/** Wrapper around the Node.js canvas library */
export class CoreNodeCanvas2D extends CoreCanvas2D {
  public constructor(dimensions: FimDimensions, canvasOptions: CoreCanvasOptions, handle: string,
      engineOptions?: FimEngineOptions) {
    super(loadFromFileAsync, dimensions, canvasOptions, handle, engineOptions);

    // Create the canvas using node-canvas
    this.canvasElement = createCanvas(dimensions.w, dimensions.h);
  }

  /** Underlying canvas backing this object */
  private canvasElement: Canvas;

  protected disposeSelf(): void {
    this.canvasElement.width = 0;
    this.canvasElement.height = 0;
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    return this.canvasElement as any;
  }

  protected createContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }

  protected createCanvas2D(dimensions: FimDimensions, canvasOptions: CoreCanvasOptions, handle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreNodeCanvas2D(dimensions, canvasOptions, handle, engineOptions);
  }

  protected async exportToFileAsync(type: CoreMimeType, quality?: number): Promise<Uint8Array> {
    const canvas = this.canvasElement;
    let buffer: Buffer;
    switch (type) {
      case CoreMimeType.JPEG:
        buffer = canvas.toBuffer(CoreMimeType.JPEG, { quality });
        break;

      case CoreMimeType.PNG:
        buffer = canvas.toBuffer(CoreMimeType.PNG);
        break;

      default:
        FimError.throwOnUnreachableCodeValue(type);
    }

    return new Uint8Array(buffer);
  }


  public async copyFromAsync(srcCanvas: CoreCanvas, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    if (srcCanvas instanceof CoreNodeCanvasWebGL) {
      // CoreNodeCanvasWebGL doesn't expose the getImageSource() needed by the base class because WebGL->2D isn't a
      // straightforward copy. We're copying between two different Node.js libraries (headless-gl -> Canvas), so
      // need to use an intermediate binary buffer to make it work.
      const me = this;
      me.ensureNotDisposed();
      srcCanvas.ensureNotDisposedAndHasImage();

      // Default parameters
      srcCoords = (srcCoords ?? FimRect.fromDimensions(srcCanvas.dim)).toFloor();
      destCoords = (destCoords ?? FimRect.fromDimensions(me.dim)).toFloor();

      srcCoords.validateIn(srcCanvas);
      destCoords.validateIn(me);

      const data = srcCanvas.exportToPixelData(srcCoords);
      if (destCoords.equals(FimRect.fromDimensions(me.dim))) {
        // Fast case: The destination is the entire canvas
        await me.loadPixelDataAsync(data, srcCoords.dim);
      } else {
        // Slow case: The destination is not the entire canvas. Use a temporary canvas to load the pixel data.
        await usingAsync(me.createTemporaryCanvas2D(undefined, srcCoords.dim), async temp => {
          await temp.loadPixelDataAsync(data);
          await super.copyFromAsync(temp, undefined, destCoords);
        });
      }

      me.hasImage = true;
    } else {
      return super.copyFromAsync(srcCanvas, srcCoords, destCoords);
    }
  }

  /**
   * Exports the canvas contents to another canvas
   * @param canvas Destination canvas
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   * @param destCoords Destination coordinates to render to. If unspecified, the output is stretched to fit the entire
   *    canvas.
   */
  public exportToCanvas(canvas: Canvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    this.exportToCanvasHelper(canvas.getContext('2d'), FimDimensions.fromObject(canvas), srcCoords, destCoords);
  }
}
