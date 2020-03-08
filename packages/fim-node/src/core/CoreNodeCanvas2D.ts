// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loadCanvasFromFileAsync } from './LoadFromFile';
import { FimDimensions, FimEngineOptions, FimImageOptions, FimRect } from '@leosingleton/fim';
import { CoreCanvas, CoreCanvas2D, CoreMimeType, RenderingContext2D } from '@leosingleton/fim/internals';
import { Canvas, createCanvas } from 'canvas';
import { CoreNodeCanvasWebGL } from './CoreNodeCanvasWebGL';
import { usingAsync } from '@leosingleton/commonlibs';

/** Wrapper around the Node.js canvas library */
export class CoreNodeCanvas2D extends CoreCanvas2D {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    super(canvasDimensions, imageHandle, engineOptions, imageOptions);

    // Create the canvas using node-canvas
    this.canvasElement = createCanvas(canvasDimensions.w, canvasDimensions.h);
  }

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

  protected createCanvas2D(canvasDimensions: FimDimensions, imageHandle: string, engineOptions: FimEngineOptions,
      imageOptions: FimImageOptions): CoreCanvas2D {
    return new CoreNodeCanvas2D(canvasDimensions, imageHandle, engineOptions, imageOptions);
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
      srcCoords = (srcCoords ?? FimRect.fromDimensions(srcCanvas.canvasDimensions)).toFloor();
      destCoords = (destCoords ?? FimRect.fromDimensions(me.canvasDimensions)).toFloor();

      srcCanvas.validateRect(srcCoords);
      me.validateRect(destCoords);

      const data = srcCanvas.exportToPixelData(srcCoords);
      if (destCoords.equals(FimRect.fromDimensions(me.canvasDimensions))) {
        // Fast case: The destination is the entire canvas
        await me.loadPixelDataAsync(data, srcCoords.dim);
      } else {
        // Slow case: The destination is not the entire canvas. Use a temporary canvas to load the pixel data.
        await usingAsync(me.createTemporaryCanvas2D(srcCoords.dim), async temp => {
          await temp.loadPixelDataAsync(data);
          await super.copyFromAsync(temp, undefined, destCoords);
        });
      }

      me.hasImage = true;
    } else {
      return super.copyFromAsync(srcCanvas, srcCoords, destCoords);
    }
  }

  public loadFromPngAsync(pngFile: Uint8Array, allowRescale = false): Promise<void> {
    return loadCanvasFromFileAsync(this, pngFile, allowRescale);
  }

  public loadFromJpegAsync(jpegFile: Uint8Array, allowRescale = false): Promise<void> {
    return loadCanvasFromFileAsync(this, jpegFile, allowRescale);
  }

  public async exportToPngAsync(): Promise<Uint8Array> {
    const buffer = this.canvasElement.toBuffer(CoreMimeType.PNG);
    return new Uint8Array(buffer);
  }

  public async exportToJpegAsync(quality: number): Promise<Uint8Array> {
    const buffer = this.canvasElement.toBuffer(CoreMimeType.JPEG, { quality });
    return new Uint8Array(buffer);
  }
}
