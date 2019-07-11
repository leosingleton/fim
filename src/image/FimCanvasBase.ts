// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from './FimCanvas';
import { FimImage } from './FimImage';
import { FimColor } from '../primitives';

/** Base class for FimCanvas and FimGLCanvas. They both share the same underlying hidden canvas on the DOM. */
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
  public abstract duplicate(): FimCanvas;

  /** Fills the canvas with a solid color */
  public abstract fill(color: FimColor | string): void;

  /**
   * Exports the canvas to a JPEG file
   * @param quality JPEG quality, 0 to 1
   * @returns Blob containing JPEG data
   */
  public async toJpegBlob(quality = 0.95): Promise<Blob> {
    return new Promise<Blob>(resolve => {
      this.canvasElement.toBlob(blob => resolve(blob), 'image/jpeg', quality);
    });
  }

  /**
   * Exports the canvas to a JPEG file
   * @param quality JPEG quality, 0 to 1
   * @returns Array containing JPEG data
   */
  public async toJpeg(quality = 0.95): Promise<Uint8Array> {
    let blob = await this.toJpegBlob(quality);
    let buffer = await new Response(blob).arrayBuffer();
    return new Uint8Array(buffer);
  }
}
