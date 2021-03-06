// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage, FimRect } from '@leosingleton/fim';

/** Represents an image and its data within the FIM library. Implemented for running in web browsers. */
export interface FimBrowserImage extends FimImage {
  /**
   * Loads the image contents from an image `Blob`
   * @param blob, Image file, as a `Blob`
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromBlobAsync(blob: Blob, allowRescale?: boolean): Promise<void>;

  /**
   * Exports the image contents to a canvas
   * @param canvas Destination canvas
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   * @param destCoords Destination coordinates to render to. If unspecified, the output is stretched to fit the entire
   *    canvas.
   * @param allowOversizedDest With the default value of `false`, an exception is thrown if `destCoords` is outside the
   *    boundaries of `canvas`. If `true`, the bounds are not checked, allowing the image to be cropped when exporting.
   */
  exportToCanvasAsync(canvas: HTMLCanvasElement, srcCoords?: FimRect, destCoords?: FimRect,
    allowOversizedDest?: boolean): Promise<void>;

  /**
   * Exports the image contents to a PNG `Blob`
   * @returns Compressed PNG file as a `Blob`
   */
  exportToPngBlobAsync(): Promise<Blob>;

  /**
   * Exports the image contents to a JPEG `Blob`
   * @param quality Optional compression quality (0.0 to 1.0)
   * @returns Compressed JPEG file as a `Blob`
   */
  exportToJpegBlobAsync(quality?: number): Promise<Blob>;
}
