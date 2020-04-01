// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage, FimRect } from '@leosingleton/fim';

/** Represents an image and its data within the FIM library. Implemented for running in web browsers. */
export interface FimBrowserImage extends FimImage {
  /**
   * Downloads a PNG file and loads the image contents
   * @param pngUrl URL to a PNG file
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromPngFileAsync(pngUrl: string, allowRescale?: boolean): Promise<void>;

  /**
   * Downloads a JPEG file and loads the image contents
   * @param jpegUrl URL to a JPEG file
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromJpegFileAsync(jpegUrl: string, allowRescale?: boolean): Promise<void>;

  /**
   * Exports the image contents to a canvas
   * @param canvas Destination canvas
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   * @param destCoords Destination coordinates to render to. If unspecified, the output is stretched to fit the entire
   *    canvas.
   */
  exportToCanvasAsync(canvas: HTMLCanvasElement, srcCoords?: FimRect, destCoords?: FimRect): Promise<void>;
}
