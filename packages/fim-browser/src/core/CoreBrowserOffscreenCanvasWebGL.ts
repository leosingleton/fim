// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserOffscreenCanvas2D } from './CoreBrowserOffscreenCanvas2D';
import { CoreBrowserTexture } from './CoreBrowserTexture';
import { FimColor, FimDimensions, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasWebGL, RenderingContextWebGL } from '@leosingleton/fim/internals';

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

  public createContext(): RenderingContextWebGL {
    return this.canvasElement.getContext('webgl');
  }

  protected createCanvas2D(canvasDimensions: FimDimensions, imageHandle: string, engineOptions: FimEngineOptions,
      imageOptions: FimImageOptions): CoreCanvas2D {
    return new CoreBrowserOffscreenCanvas2D(canvasDimensions, imageHandle, engineOptions, imageOptions);
  }

  protected createCoreTextureInternal(parent: CoreCanvasWebGL, handle: string, dimensions: FimDimensions,
      options: FimImageOptions): CoreBrowserTexture {
    return new CoreBrowserTexture(parent, handle, dimensions, options);
  }

  protected addCanvasEventListener(type: string, listener: EventListenerObject, options: boolean): void {
    this.canvasElement.addEventListener(type, listener, options);
  }

  protected removeCanvasEventListener(type: string, listener: EventListenerObject, options: boolean): void {
    this.canvasElement.removeEventListener(type, listener, options);
  }

  public fillSolid(color: FimColor | string): void {
    // Chrome has a bug where subsequent calls to clear() do not work with OffscreenCanvas. Workaround by using a WebGL
    // shader instead. See: https://bugs.chromium.org/p/chromium/issues/detail?id=989874
    if (this.workaroundChromeBug) {
      const c = (color instanceof FimColor) ? color : FimColor.fromString(color);
      const fill = this.getFillShader();
      fill.setUniforms({
        uColor: c.toVector()
      });
      fill.execute();
    } else {
      // Use workaround on the next call to fillSolid()
      this.workaroundChromeBug = true;

      // Use the normal method on the first call to fillSolid()
      super.fillSolid(color);
    }
  }

  /** Set to `true` on the first call to `fillSolid()` to use the workaround on subsequent calls */
  private workaroundChromeBug: boolean;
}
