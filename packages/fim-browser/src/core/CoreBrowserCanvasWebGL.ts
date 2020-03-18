// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserCanvas2D } from './CoreBrowserCanvas2D';
import { CoreBrowserTexture } from './CoreBrowserTexture';
import { DisposableCanvas, DomCanvasPoolWebGL } from './DomCanvasPool';
import { FimDimensions, FimEngineOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, CoreTextureOptions,
  RenderingContextWebGL } from '@leosingleton/fim/internals';

/** Wrapper around the HTML DOM canvas */
export class CoreBrowserCanvasWebGL extends CoreCanvasWebGL {
  public constructor(canvasOptions: CoreCanvasOptions, canvasDimensions: FimDimensions, imageHandle: string,
      engineOptions?: FimEngineOptions) {
    super(canvasOptions, canvasDimensions, imageHandle, engineOptions);

    // Create a hidden canvas
    const canvas = CoreBrowserCanvasWebGL.canvasPool.getCanvas();
    canvas.width = canvasDimensions.w;
    canvas.height = canvasDimensions.h;
    canvas.style.display = 'none';
    canvas.id = imageHandle;
    document.body.appendChild(canvas);
    this.canvasElement = canvas;

    this.finishInitialization();
  }

  /** Canvas pool of WebGL canvases */
  private static canvasPool = new DomCanvasPoolWebGL();

  private canvasElement: DisposableCanvas;

  protected disposeSelf(): void {
    this.canvasElement.dispose();
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    return this.canvasElement;
  }

  public createContext(): RenderingContextWebGL {
    return this.canvasElement.getContext('webgl');
  }

  protected createCanvas2D(canvasOptions: CoreCanvasOptions, canvasDimensions: FimDimensions, imageHandle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreBrowserCanvas2D(canvasOptions, canvasDimensions, imageHandle, engineOptions);
  }

  protected createCoreTextureInternal(parent: CoreCanvasWebGL, options: CoreTextureOptions, dimensions: FimDimensions,
      handle: string): CoreBrowserTexture {
    return new CoreBrowserTexture(parent, options, dimensions, handle);
  }

  protected addCanvasEventListener(type: string, listener: EventListenerObject, options: boolean): void {
    this.canvasElement.addEventListener(type, listener, options);
  }

  protected removeCanvasEventListener(type: string, listener: EventListenerObject, options: boolean): void {
    this.canvasElement.removeEventListener(type, listener, options);
  }
}
