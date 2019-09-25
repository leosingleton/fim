// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimError, FimErrorCode } from './FimError';
import { FimWeb } from '../Fim';
import { ResourcePool, RetentionStrategy, IDisposable, makeDisposable } from '@leosingleton/commonlibs';

/** Canvas types */
export const enum FimCanvasType {
  Canvas2D,
  WebGL
}

/**
 * Factory method to create HTMLCanvasElement or OffscreenCanvas objects. These could be the actual browser objects, or
 * a mock object to support NodeJS or other platforms.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @param canvasType Type of the canvas, either 2D or WebGL
 * @param canvasId Unique ID for logging and debugging
 * @returns HTMLCanvasElement or OffscreenCanvas object
 */
export type FimCanvasFactory = (width: number, height: number, canvasType: FimCanvasType, canvasId: string) =>
  (HTMLCanvasElement | OffscreenCanvas) & IDisposable;

type DisposableCanvas = HTMLCanvasElement & IDisposable;

/**
 * Constructs a hidden DOM canvas in a web browser.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @param canvasType Type of the canvas, either 2D or WebGL
 * @param canvasId Unique ID for logging and debugging
 * @returns HTMLCanvasElement object
 */
export function FimDomCanvasFactory(width: number, height: number, canvasType: FimCanvasType, canvasId: string):
    DisposableCanvas {
  // Create a hidden canvas
  let canvas = domCanvasPool.getCanvas(canvasType);
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'none';
  canvas.id = canvasId;
  document.body.appendChild(canvas);

  return canvas;
}

/**
 * Safari has a hard limit of 15 WebGL contexts, at which point it logs an error to the JavaScript console and drops
 * the least recently used. The Khronos specs say the lose_context extention is supposed to allow you to force dispose
 * (https://www.khronos.org/registry/webgl/extensions/WEBGL_lose_context/) however it doesn't seem to work. Instead, we
 * use a resource pool to reuse canvases rather than waiting for the garbage collector to dispose them.
 */
class DomCanvasPool extends ResourcePool<DisposableCanvas> {
  public constructor() {
    super(RetentionStrategy.KeepMaximum);
  }

  public getCanvas(canvasType: FimCanvasType): DisposableCanvas {
    return this.getOrCreateObject(canvasType.toString(), () => {
      let canvas = document.createElement('canvas');
      return makeDisposable(canvas, canvas => {
        // Resizing the canvas to zero seems to help Safari release memory without having to wait for the garbage
        // collector. This helps prevent crashes, particularly on mobile devices.
        canvas.width = 0;
        canvas.height = 0;

        document.body.removeChild(canvas);
      });
    });
  }

  protected freeze(canvas: DisposableCanvas) {
    // Resizing the canvas to zero seems to help Safari release memory without having to wait for the garbage
    // collector. This helps prevent crashes, particularly on mobile devices.
    canvas.width = 0;
    canvas.height = 0;
  }
}

let domCanvasPool = new DomCanvasPool();

/**
 * Constructs an OffscreenCanvas using Chrome's implementation. Be sure to check Fim.supportsOffscreenCanvas before
 * calling this function.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @param canvasType Type of the canvas, either 2D or WebGL
 * @param canvasId Unique ID for logging and debugging
 * @returns OffscreenCanvas object
 */
export function FimOffscreenCanvasFactory(width: number, height: number, canvasType: FimCanvasType, canvasId: string):
    OffscreenCanvas & IDisposable {
  // Use Chrome's OffscreenCanvas object
  if (!FimWeb.supportsOffscreenCanvas) {
    // The browser does not support OffscreenCanvas
    throw new FimError(FimErrorCode.AppError, 'NoOffScreenCanvas');
  }

  // uglify-js is not yet aware of OffscreenCanvas and name mangles it
  // @nomangle OffscreenCanvas convertToBlob
  return makeDisposable(new OffscreenCanvas(width, height), canvas => {
    // Chrome is the only browser that currently supports OffscreenCanvas, and I've never actually hit an out-of-memory
    // error with it, even on mobile, but it probably doesn't hurt to resize the canvas to zero.
    canvas.width = 0;
    canvas.height = 0;
  });
}
