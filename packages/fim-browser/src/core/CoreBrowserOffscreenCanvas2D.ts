// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserCanvas2D } from './CoreBrowserCanvas2D';
import { loadFromFileAsync } from './ImageLoader';
import { FimDimensions, FimEngineOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreMimeType, RenderingContext2D } from '@leosingleton/fim/internals';

/** Wrapper around the browser's OffscreenCanvas */
export class CoreBrowserOffscreenCanvas2D extends CoreBrowserCanvas2D {
  public constructor(dimensions: FimDimensions, canvasOptions: CoreCanvasOptions, handle: string,
      engineOptions?: FimEngineOptions) {
    super(loadFromFileAsync, dimensions, canvasOptions, handle, engineOptions);
    this.canvasElement = new OffscreenCanvas(dimensions.w, dimensions.h);
  }

  /** Underlying canvas backing this object */
  private canvasElement: OffscreenCanvas;

  protected disposeSelf(): void {
    // Chrome is the only browser that currently supports OffscreenCanvas, and I've never actually hit an out-of-memory
    // error with it, even on mobile, but it probably doesn't hurt to resize the canvas to zero.
    this.canvasElement.width = 0;
    this.canvasElement.height = 0;
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    // Forcing conversion from OffscreenCanvas to CanvasImageSource. Although TypeScript won't allow it, it previously
    // worked and the Mozilla docs say it is supported:
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasImageSource
    return this.canvasElement as unknown as CanvasImageSource;
  }

  protected createContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }

  protected createCanvas2D(dimensions: FimDimensions, canvasOptions: CoreCanvasOptions, handle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreBrowserOffscreenCanvas2D(dimensions, canvasOptions, handle, engineOptions);
  }

  public convertToBlobAsync(type: CoreMimeType, quality?: number): Promise<Blob> {
    return this.canvasElement.convertToBlob({ type, quality });
  }
}
