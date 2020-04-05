// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserCanvas2D } from './CoreBrowserCanvas2D';
import { loadFromFileAsync } from './ImageLoader';
import { FimDimensions, FimEngineOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreMimeType, RenderingContext2D } from '@leosingleton/fim/internals';

// uglify-js is not yet aware of OffscreenCanvas and name mangles it
// @nomangle OffscreenCanvas convertToBlob

/** Wrapper around the browser's OffscreenCanvas */
export class CoreBrowserOffscreenCanvas2D extends CoreBrowserCanvas2D {
  public constructor(canvasOptions: CoreCanvasOptions, dimensions: FimDimensions, handle: string,
      engineOptions?: FimEngineOptions) {
    super(loadFromFileAsync, canvasOptions, dimensions, handle, engineOptions);
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
    return this.canvasElement;
  }

  protected createContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }

  protected createCanvas2D(canvasOptions: CoreCanvasOptions, dimensions: FimDimensions, handle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreBrowserOffscreenCanvas2D(canvasOptions, dimensions, handle, engineOptions);
  }

  protected convertToBlobAsync(type: CoreMimeType, quality?: number): Promise<Blob> {
    return this.canvasElement.convertToBlob({ type, quality });
  }
}
