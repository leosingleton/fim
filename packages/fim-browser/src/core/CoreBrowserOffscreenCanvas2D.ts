// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, RenderingContext2D } from '@leosingleton/fim/internals';

// uglify-js is not yet aware of OffscreenCanvas and name mangles it
// @nomangle OffscreenCanvas convertToBlob

/** Wrapper around the browser's OffscreenCanvas */
export class CoreBrowserOffscreenCanvas2D extends CoreCanvas2D {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    super(canvasDimensions, imageHandle, engineOptions, imageOptions);
    this.canvasElement = new OffscreenCanvas(canvasDimensions.w, canvasDimensions.h);
  }

  private canvasElement: OffscreenCanvas;

  public dispose() {
    // Chrome is the only browser that currently supports OffscreenCanvas, and I've never actually hit an out-of-memory
    // error with it, even on mobile, but it probably doesn't hurt to resize the canvas to zero.
    this.canvasElement.width = 0;
    this.canvasElement.height = 0;
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    return this.canvasElement;
  }

  protected getContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }
}
