// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loadCanvasFromFileAsync } from './LoadFromFile';
import { FimDimensions, FimEngineOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreMimeType, RenderingContext2D } from '@leosingleton/fim/internals';

// uglify-js is not yet aware of OffscreenCanvas and name mangles it
// @nomangle OffscreenCanvas convertToBlob

/** Wrapper around the browser's OffscreenCanvas */
export class CoreBrowserOffscreenCanvas2D extends CoreCanvas2D {
  public constructor(canvasOptions: CoreCanvasOptions, dimensions: FimDimensions, handle: string,
      engineOptions?: FimEngineOptions) {
    super(canvasOptions, dimensions, handle, engineOptions);
    this.canvasElement = new OffscreenCanvas(dimensions.w, dimensions.h);
  }

  private canvasElement: OffscreenCanvas;

  protected disposeSelf(): void {
    // Chrome is the only browser that currently supports OffscreenCanvas, and I've never actually hit an out-of-memory
    // error with it, even on mobile, but it probably doesn't hurt to resize the canvas to zero.
    this.canvasElement.width = 0;
    this.canvasElement.height = 0;
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    return this.canvasElement;
  }

  protected createContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }

  protected createCanvas2D(canvasOptions: CoreCanvasOptions, dimensions: FimDimensions, handle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreBrowserOffscreenCanvas2D(canvasOptions, dimensions, handle, engineOptions);
  }

  public loadFromPngAsync(pngFile: Uint8Array, allowRescale = false): Promise<void> {
    return loadCanvasFromFileAsync(this, pngFile, CoreMimeType.PNG, allowRescale);
  }

  public loadFromJpegAsync(jpegFile: Uint8Array, allowRescale = false): Promise<void> {
    return loadCanvasFromFileAsync(this, jpegFile, CoreMimeType.JPEG, allowRescale);
  }

  public async exportToPngAsync(): Promise<Uint8Array> {
    const blob = await this.canvasElement.convertToBlob({});
    const buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }

  public async exportToJpegAsync(quality: number): Promise<Uint8Array> {
    const blob = await this.canvasElement.convertToBlob({ type: CoreMimeType.JPEG, quality });
    const buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }
}
