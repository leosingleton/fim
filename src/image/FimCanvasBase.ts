// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from './FimCanvas';
import { FimImage } from './FimImage';
import { FimRgbaBuffer } from './FimRgbaBuffer';
import { FimColor, FimRect } from '../primitives';
import { using } from '@leosingleton/commonlibs';

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

  /** Creates a new FimCanvas which is a duplicate of this one */
  public duplicate(): FimCanvas {
    let dupe = new FimCanvas(this.dimensions.w, this.dimensions.h);
    dupe.copyFromCanvas(this, this.dimensions, this.dimensions);
    return dupe;
  }

  /**
   * Copies image to another FimCanvas. Supports both cropping and rescaling.
   * @param destImage Destination image
   * @param srcCoords Coordinates of source image to copy
   * @param destCoords Coordinates of destination image to copy to
   */
  public copyToCanvas(destImage: FimCanvas, srcCoords?: FimRect, destCoords?: FimRect): void {
    destImage.copyFromCanvas(this, srcCoords, destCoords);
  }
}
