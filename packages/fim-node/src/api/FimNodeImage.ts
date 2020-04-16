// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage, FimRect } from '@leosingleton/fim';
import { Canvas } from 'canvas';

/** Represents an image and its data within the FIM library. Implemented for running in Node.js. */
export interface FimNodeImage extends FimImage {
  /**
   * Reads a PNG file from disk and loads the image contents
   * @param pngPath Path to a PNG file
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromPngFileAsync(pngPath: string, allowRescale?: boolean): Promise<void>;

  /**
   * Reads a JPEG file from disk and loads the image contents
   * @param jpegPath Path to a JPEG file
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromJpegFileAsync(jpegPath: string, allowRescale?: boolean): Promise<void>;

  /**
   * Exports the image contents to a canvas
   * @param canvas Destination canvas
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   * @param destCoords Destination coordinates to render to. If unspecified, the output is stretched to fit the entire
   *    canvas.
   * @param allowOversizedDest With the default value of `false`, an exception is thrown if `destCoords` is outside the
   *    boundaries of `canvas`. If `true`, the bounds are not checked, allowing the image to be cropped when exporting.
   */
  exportToCanvasAsync(canvas: Canvas, srcCoords?: FimRect, destCoords?: FimRect, allowOversizedDest?: boolean):
    Promise<void>;
}
