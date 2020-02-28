// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor, FimDimensions, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvasWebGL, RenderingContextWebGL } from '@leosingleton/fim/internals';

// uglify-js is not yet aware of OffscreenCanvas and name mangles it
// @nomangle OffscreenCanvas convertToBlob

/** Wrapper around the browser's OffscreenCanvas */
export class CoreBrowserOffscreenCanvasWebGL extends CoreCanvasWebGL {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    super(canvasDimensions, imageHandle, engineOptions, imageOptions);
    this.canvasElement = new OffscreenCanvas(canvasDimensions.w, canvasDimensions.h);

    this.finishInitialization();
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

  public getContext(): RenderingContextWebGL {
    return this.canvasElement.getContext('webgl');
  }

  protected addCanvasEventListener(type: string, listener: EventListenerObject, options: boolean): void {
    this.canvasElement.addEventListener(type, listener, options);
  }

  protected removeCanvasEventListener(type: string, listener: EventListenerObject, options: boolean): void {
    this.canvasElement.removeEventListener(type, listener, options);
  }

  public fillCanvas(color: FimColor | string): void {
    // TODO: Chrome has a bug where subsequent calls to clear() do not work with OffscreenCanvas. Workaround by using a
    //       WebGL shader instead. See: https://bugs.chromium.org/p/chromium/issues/detail?id=989874
    return super.fillCanvas(color);
  }
}
