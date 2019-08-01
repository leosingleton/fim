// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from './FimCanvas';
import { FimImage } from './FimImage';
import { FimColor } from '../primitives';

// OffscreenCanvas was added in Chrome 69, but still not supported by other browsers as of July 2019
// @nomangle OffscreenCanvas convertToBlob
declare class OffscreenCanvas extends EventTarget {
  constructor(width: number, height: number);
  width: number;
  height: number;
  getContext(contextType: '2d', contextAttributes?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D;
  getContext(contextType: 'webgl', contextAttributes?: WebGLContextAttributes): WebGLRenderingContext;
  convertToBlob(options: any): Promise<Blob>;
}

/** Base class for FimCanvas and FimGLCanvas. They both share the same underlying hidden canvas on the DOM. */
export abstract class FimCanvasBase extends FimImage {
  /**
   * Creates an invisible canvas in the DOM
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param useOffscreenCanvas If this parameter is true, an offscreen canvas will be used. These can be used in web
   *    workers. Check FimCanvasBase.supportsOffscreenCanvas to determine whether the web browser supports the
   *    OffscreenCanvas feature.
   * @param maxDimension WebGL framebuffers have maximum sizes, which can be as low as 2048x2048. If the canvas width
   *    or height exceeds this, the image will be automatically downscaled.
   */
  public constructor(width: number, height: number, useOffscreenCanvas = FimCanvasBase.supportsOffscreenCanvas,
      maxDimension = 0) {
    // Call the parent constructor. Read the new dimensions as they may get downscaled.
    super(width, height, maxDimension);
    let realDimensions = this.realDimensions;

    if (useOffscreenCanvas) {
      // Use Chrome's OffscreenCanvas object
      if (!FimCanvasBase.supportsOffscreenCanvas) {
        // The browser does not support OffscreenCanvas
        throw new Error('No OffScreenCanvas');
      }
      this.canvasElement = new OffscreenCanvas(realDimensions.w, realDimensions.h);
    } else {
      // Create a hidden canvas
      let canvas = document.createElement('canvas');
      canvas.width = realDimensions.w;
      canvas.height = realDimensions.h;
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
      this.canvasElement = canvas;
    }

    this.offscreenCanvas = useOffscreenCanvas;
  }

  /** Returns the underlying HTMLCanvasElement or OffscreenCanvas */
  public getCanvas(): HTMLCanvasElement {
    return this.canvasElement as HTMLCanvasElement;
  }
  protected canvasElement: HTMLCanvasElement | OffscreenCanvas;

  public dispose(): void {
    if (this.canvasElement) {
      if (this.canvasElement instanceof HTMLCanvasElement) {
        document.body.removeChild(this.canvasElement);
      }
      delete this.canvasElement;
    }
  }

  /** True if this object is backed by an OffscreenCanvas; false for a standard 2D canvas */
  public offscreenCanvas: boolean;

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
    if (this.canvasElement instanceof HTMLCanvasElement) {
      let canvas = this.canvasElement;
      return new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
      });
    } else {
      return this.canvasElement.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
    }
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

  /** Determines whether the current browser supports offscreen canvases */
  public static readonly supportsOffscreenCanvas = (typeof OffscreenCanvas !== 'undefined');
}
