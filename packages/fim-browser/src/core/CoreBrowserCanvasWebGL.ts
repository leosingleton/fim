// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DisposableCanvas, DomCanvasPoolWebGL } from './DomCanvasPool';
import { FimDimensions, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvasWebGL, RenderingContextWebGL } from '@leosingleton/fim/internals';

/** Wrapper around the HTML DOM canvas */
export class CoreBrowserCanvasWebGL extends CoreCanvasWebGL {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    super(canvasDimensions, imageHandle, engineOptions, imageOptions);

    // Create a hidden canvas
    const canvas = CoreBrowserCanvasWebGL.canvasPool.getCanvas();
    canvas.width = canvasDimensions.w;
    canvas.height = canvasDimensions.h;
    canvas.style.display = 'none';
    canvas.id = imageHandle;
    document.body.appendChild(canvas);
    this.canvasElement = canvas;
  }

  private canvasElement: DisposableCanvas;

  public dispose() {
    this.canvasElement.dispose();
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    return this.canvasElement;
  }

  protected getContext(): RenderingContextWebGL {
    return this.canvasElement.getContext('webgl');
  }

  /** Canvas pool of WebGL canvases */
  private static canvasPool = new DomCanvasPoolWebGL();
}
