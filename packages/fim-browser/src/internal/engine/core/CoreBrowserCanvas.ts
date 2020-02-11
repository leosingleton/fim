// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CanvasType, DisposableCanvas, domCanvasPool } from './DomCanvasPool';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas, RenderingContext2D } from '@leosingleton/fim/internals';

/** Wrapper around the HTML DOM canvas */
export class CoreBrowserCanvas extends CoreCanvas {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string) {
    super(canvasDimensions, imageHandle);

    // Create a hidden canvas
    const canvas = domCanvasPool.getCanvas(CanvasType.Canvas2D);
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

  protected getContext2D(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }
}
