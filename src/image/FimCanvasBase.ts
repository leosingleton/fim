// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage } from './FimImage';

/** An image consisting of an invisible HTML canvas on the DOM */
export abstract class FimCanvasBase extends FimImage {
  /**
   * Creates an invisible canvas in the DOM
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   */
  public constructor(width: number, height: number) {
    super(width, height);

    // Create a hidden canvas
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    this.canvasElement = canvas;
  }

  /** Returns the underlying HTMLCanvasElement */
  public getCanvas(): HTMLCanvasElement {
    return this.canvasElement;
  }
  protected canvasElement: HTMLCanvasElement;

  public dispose(): void {
    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement);
      delete this.canvasElement;
    }
  }
}
