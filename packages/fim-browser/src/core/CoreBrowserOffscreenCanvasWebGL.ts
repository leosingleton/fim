// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserOffscreenCanvas2D } from './CoreBrowserOffscreenCanvas2D';
import { CoreBrowserTexture } from './CoreBrowserTexture';
import { FimColor, FimDimensions, FimEngineOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, CoreTextureOptions,
  RenderingContextWebGL } from '@leosingleton/fim/internals';

/** Wrapper around the browser's OffscreenCanvas */
export class CoreBrowserOffscreenCanvasWebGL extends CoreCanvasWebGL {
  public constructor(dimensions: FimDimensions, canvasOptions: CoreCanvasOptions, handle: string,
      engineOptions?: FimEngineOptions) {
    super(dimensions, canvasOptions, handle, engineOptions);
    this.canvasElement = new OffscreenCanvas(dimensions.w, dimensions.h);

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

  protected createCanvas2D(dimensions: FimDimensions, canvasOptions: CoreCanvasOptions, handle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreBrowserOffscreenCanvas2D(dimensions, canvasOptions, handle, engineOptions);
  }

  protected createCoreTextureInternal(parent: CoreCanvasWebGL, dimensions: FimDimensions, options: CoreTextureOptions,
      handle: string): CoreBrowserTexture {
    return new CoreBrowserTexture(parent, dimensions, options, handle);
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
      const c = FimColor.fromColorOrString(color);
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
