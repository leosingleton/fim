// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loadCanvasFromFileAsync } from './LoadFromFile';
import { FimDimensions, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreMimeType, RenderingContext2D } from '@leosingleton/fim/internals';
import { Canvas, createCanvas } from 'canvas';

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
