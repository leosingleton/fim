// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DisposableCanvas, DomCanvasPool } from './DomCanvasPool';
import { loadCanvasFromFileAsync } from './LoadFromFile';
import { FimDimensions, FimEngineOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreMimeType, RenderingContext2D } from '@leosingleton/fim/internals';

/** Wrapper around the HTML DOM canvas */
export class CoreBrowserCanvas2D extends CoreCanvas2D {
  public constructor(canvasOptions: CoreCanvasOptions, canvasDimensions: FimDimensions, imageHandle: string,
      engineOptions?: FimEngineOptions) {
    super(canvasOptions, canvasDimensions, imageHandle, engineOptions);

    // Create a hidden canvas
    const canvas = CoreBrowserCanvas2D.canvasPool.getCanvas();
    canvas.width = canvasDimensions.w;
    canvas.height = canvasDimensions.h;
    canvas.style.display = 'none';
    canvas.id = imageHandle;
    document.body.appendChild(canvas);
    this.canvasElement = canvas;
  }

  /** Canvas pool of 2D canvases */
  private static canvasPool = new DomCanvasPool();

  private canvasElement: DisposableCanvas;

  protected disposeSelf(): void {
    this.canvasElement.dispose();
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    return this.canvasElement;
  }

  protected createContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }

  protected createCanvas2D(canvasOptions: CoreCanvasOptions, canvasDimensions: FimDimensions, imageHandle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreBrowserCanvas2D(canvasOptions, canvasDimensions, imageHandle, engineOptions);
  }

  public loadFromPngAsync(pngFile: Uint8Array, allowRescale = false): Promise<void> {
    return loadCanvasFromFileAsync(this, pngFile, CoreMimeType.PNG, allowRescale);
  }

  public loadFromJpegAsync(jpegFile: Uint8Array, allowRescale = false): Promise<void> {
    return loadCanvasFromFileAsync(this, jpegFile, CoreMimeType.JPEG, allowRescale);
  }

  public async exportToPngAsync(): Promise<Uint8Array> {
    const blob = await this.toPngBlobAsync();
    const buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }

  /** Helper function for `exportToPngAsync()` */
  private toPngBlobAsync(): Promise<Blob> {
    return new Promise<Blob>(resolve => {
      this.canvasElement.toBlob(blob => resolve(blob));
    });
  }

  public async exportToJpegAsync(quality: number): Promise<Uint8Array> {
    const blob = await this.toJpegBlobAsync(quality);
    const buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }

  /** Helper function for `exportToJpegAsync()` */
  private toJpegBlobAsync(quality: number): Promise<Blob> {
    return new Promise<Blob>(resolve => {
      this.canvasElement.toBlob(blob => resolve(blob), CoreMimeType.JPEG, quality);
    });
  }
}
