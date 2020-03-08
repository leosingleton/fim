// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageOptions } from './FimImageOptions';
import { FimObject } from './FimObject';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';

/** Represents an image and its data within the FIM library */
export interface FimImage extends FimObject {
  /** Image dimensions */
  readonly imageDimensions: FimDimensions;

  /**
   * Image options
   *
   * Note that these properties are read/write, despite the reference to the object being read-only. The application may
   * attempt to change them after image creation, however changes are not guaranteed to take effect immediately.
   * Generally options take effect on the next method call, however some require calling releaseResources() to recreate
   * the back-end objects altogether.
   *
   * Also note that an undefined value here inherits the value from the parent FIM class, including any changes that may
   * occur to the global defaultImageOptions.
   */
  readonly imageOptions: FimImageOptions;

  /**
   * Fills the image with a solid color
   * @param color Fill color
   */
  fillSolid(color: FimColor | string): void;

  /**
   * Returns the value of one pixel.
   *
   * Note that this call is fairly inefficient, and should only be used infrequently, mainly for debugging.
   *
   * @param point X and Y coordinates, in pixels
   * @returns RGBA color value
   */
  getPixel(point: FimPoint): FimColor;

  /**
   * Loads the image contents from RGBA data
   * @param pixelData An array containing 4 bytes per pixel, in RGBA order
   * @param dimensions Optional dimensions of `pixelData`. If not provided, it is assumed to be the same dimensions as
   *    the image. If provided, the dimensions may be different from the image, in which case the image contents will
   *    be automatically rescaled. If not provided, then `pixelData` must be the same dimensions as the image.
   */
  loadPixelDataAsync(pixelData: Uint8ClampedArray, dimensions?: FimDimensions): Promise<void>;

  /**
   * Loads the image contents from a PNG file
   * @param pngFile PNG file, as a Uint8Array
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromPngAsync(pngFile: Uint8Array, allowRescale?: boolean): Promise<void>;

  /**
   * Loads the image contents from a JPEG file
   * @param jpegFile JPEG file, as a Uint8Array
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromJpegAsync(jpegFile: Uint8Array, allowRescale?: boolean): Promise<void>;

  /**
   * Copies contents from another image. Supports both cropping and rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy from
   * @param destCoords Coordinates of destination image to copy to
   */
  copyFromAsync(srcImage: FimImage, srcCoords?: FimRect, destCoords?: FimRect): Promise<void>;

  /**
   * Exports the image contents to a PNG file
   * @returns Compressed PNG file as a Uint8Array
   */
  exportToPngAsync(): Promise<Uint8Array>;

  /**
   * Exports the image contents to a JPEG file
   * @param quality Optional compression quality (0.0 to 1.0)
   * @returns Compressed JPEG file as a Uint8Array
   */
  exportToJpegAsync(quality?: number): Promise<Uint8Array>;
}
