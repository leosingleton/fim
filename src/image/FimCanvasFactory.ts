// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimWeb } from '../Fim';
import { IDisposable, makeDisposable } from '@leosingleton/commonlibs';

/**
 * Factory method to create HTMLCanvasElement or OffscreenCanvas objects. These could be the actual browser objects, or
 * a mock object to support NodeJS or other platforms.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @param canvasId Unique ID for logging and debugging
 * @returns HTMLCanvasElement or OffscreenCanvas object
 */
export type FimCanvasFactory = (width: number, height: number, canvasId: string) =>
  (HTMLCanvasElement | OffscreenCanvas) & IDisposable;

/**
 * Constructs a hidden DOM canvas in a web browser.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @param canvasId Unique ID for logging and debugging
 * @returns HTMLCanvasElement object
 */
export function FimDomCanvasFactory(width: number, height: number, canvasId: string): HTMLCanvasElement & IDisposable {
  // Create a hidden canvas
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'none';
  canvas.id = canvasId;
  document.body.appendChild(canvas);

  // Add a .dispose() method to remove the canvas from the DOM
  return makeDisposable(canvas, canvas => {
    document.body.removeChild(canvas);
  });
}

/**
 * Constructs an OffscreenCanvas using Chrome's implementation. Be sure to check Fim.supportsOffscreenCanvas before
 * calling this function.
 * @param width Width of the canvas, in pixels
 * @param height Height of the canvas, in pixels
 * @param canvasId Unique ID for logging and debugging
 * @returns OffscreenCanvas object
 */
export function FimOffscreenCanvasFactory(width: number, height: number, canvasId: string):
    OffscreenCanvas & IDisposable {
  // Use Chrome's OffscreenCanvas object
  if (!FimWeb.supportsOffscreenCanvas) {
    // The browser does not support OffscreenCanvas
    throw new Error('No OffScreenCanvas');
  }

  // uglify-js is not yet aware of OffscreenCanvas and name mangles it
  // @nomangle OffscreenCanvas convertToBlob
  return makeDisposable(new OffscreenCanvas(width, height), canvas => {});
}
