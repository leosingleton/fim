// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, RenderingContext2D } from '@leosingleton/fim/internals';
import { Canvas, createCanvas } from 'canvas';

/** Wrapper around the Node.js canvas library */
export class CoreNodeCanvas2D extends CoreCanvas2D {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    super(canvasDimensions, imageHandle, engineOptions, imageOptions);

    // Create the canvas using node-canvas
    this.canvasElement = createCanvas(canvasDimensions.w, canvasDimensions.h);
  }

  private canvasElement: Canvas;

  protected disposeSelf(): void {
    this.canvasElement.width = 0;
    this.canvasElement.height = 0;
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    return this.canvasElement as any;
  }

  protected getContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }
}