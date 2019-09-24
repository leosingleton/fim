// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimError, FimErrorCode } from './FimError';
import { FimWeb } from '../Fim';
import { IDisposable, makeDisposable } from '@leosingleton/commonlibs';

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

/**
 * Constructs a hidden DOM canvas in a web browser.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @param canvasType Type of the canvas, either 2D or WebGL
 * @param canvasId Unique ID for logging and debugging
 * @returns HTMLCanvasElement object
 */
export function FimDomCanvasFactory(width: number, height: number, canvasType: FimCanvasType, canvasId: string):
    HTMLCanvasElement & IDisposable {
  // Create a hidden canvas
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'none';
  canvas.id = canvasId;
  document.body.appendChild(canvas);

  // Add a .dispose() method to remove the canvas from the DOM
  return makeDisposable(canvas, canvas => {
    // Resizing the canvas to zero seems to help Safari release memory without having to wait for the garbage
    // collector. This helps prevent crashes, particularly on mobile devices.
    canvas.width = 0;
    canvas.height = 0;

    document.body.removeChild(canvas);
  });
}

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
