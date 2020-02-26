// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreMimeType, RenderingContext2D } from '@leosingleton/fim/internals';
import { Canvas, Image, createCanvas } from 'canvas';

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

  protected getContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }

  protected createTemporaryCanvas2D(dimensions: FimDimensions): CoreCanvas2D {
    return new CoreNodeCanvas2D(dimensions, `${this.imageHandle}/Temp`, this.engineOptions, this.imageOptions);
  }

  public loadFromPngAsync(pngFile: Uint8Array, allowRescale = false): Promise<void> {
    return this.loadFromFileAsync(pngFile, allowRescale);
  }

  public loadFromJpegAsync(jpegFile: Uint8Array, allowRescale = false): Promise<void> {
    return this.loadFromFileAsync(jpegFile, allowRescale);
  }

  /** Internal implementation for `loadFromPngAsync()` and `loadFromJpegAsync()` */
  private loadFromFileAsync(file: Uint8Array, allowRescale: boolean): Promise<void> {
    // Create a Buffer holding the binary data and load it onto an HTMLImageElement. Unlike the browser's Blob,
    // Node.js's Buffer doesn't care about mime types so accepts multiple file formats.
    const buffer = Buffer.from(file);

    return new Promise((resolve, reject) => {
      const img = new Image();

      // On success, copy the image to a FimCanvas and return it via the Promise
      img.onload = () => {
        this.loadFromImage(img, allowRescale);
        resolve();
      };

      // On error, return an exception via the Promise
      img.onerror = err => {
        reject(err);
      };

      img.src = buffer;
    });
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
