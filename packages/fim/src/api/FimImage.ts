// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageOptions } from './FimImageOptions';
import { FimObject } from './FimObject';
import { FimOperation } from './FimOperation';
import { FimShader } from './FimShader';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';

/** Represents an image and its data within the FIM library */
export interface FimImage extends FimObject {
  /** Image dimensions */
  readonly dim: FimDimensions;

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
   * Returns `true` if the image has contents. When `false`, using this image an an input parameter will throw an
   * exception. Note that the behavior of a WebGL context loss varies depending on the image options. By default,
   * `hasImage()` may return `false` if there is no `imageOptions.backup` was not enabled. However if
   * `imageOptions.fillColorOnContextLost` is set, then the image is initialized to the specified fill color and
   * `hasImage()` returns `true`.
   */
  hasImage(): boolean;

  /**
   * Computes and returns the current image options, taking into account the local `imageOptions` property, default
   * options inherited from the parent FIM instance, and any existing resources which may have been allocated prior to
   * changes to either.
   */
  getEffectiveImageOptions(): FimImageOptions;

  /**
   * Backs up any WebGL textures so that the image contents are not lost if the WebGL context is lost. The contents will
   * be preserved until the next call to `executeAsync()`.
   *
   * Instead of explicitly calling this method, callers can also automatically back up the WebGL textures after every
   * call to `executeAsync()` by enabling `imageOptions.autoBackup`.
   */
  backupAsync(): Promise<void>;

  /**
   * Fills the image with a solid color
   * @param color Fill color
   */
  fillSolidAsync(color: FimColor | string): Promise<void>;

  /**
   * Returns the value of one pixel.
   *
   * Note that this call is fairly inefficient, and should only be used infrequently, mainly for debugging.
   *
   * @param point X and Y coordinates, in pixels
   * @returns RGBA color value
   */
  getPixelAsync(point: FimPoint): Promise<FimColor>;

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
   * Reads or downloads a PNG file and loads the image contents
   * @param pngUrlOrPath URL or path to a PNG file. Support varies by platform.
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromPngFileAsync(pngUrl: string, allowRescale?: boolean): Promise<void>;

  /**
   * Reads or downloads a JPEG file and loads the image contents
   * @param jpegUrlOrPath URL or path to a JPEG file. Support varies by platform.
   * @param allowRescale With the default value of `false`, then the dimensions of `image` must match the dimensions of
   *    this canvas. Otherwise, if `allowRescale` is `true`, then the contents of `image` will be automatically rescaled
   *    to fit this canvas.
   */
  loadFromJpegFileAsync(jpegUrl: string, allowRescale?: boolean): Promise<void>;

  /**
   * Copies contents from another image. Supports both cropping and rescaling.
   * @param srcImage Source image
   * @param srcCoords Coordinates of source image to copy from
   * @param destCoords Coordinates of destination image to copy to
   */
  copyFromAsync(srcImage: FimImage, srcCoords?: FimRect, destCoords?: FimRect): Promise<void>;

  /**
   * Executes a WebGL fragment shader or FIM operation and renders the result to this image
   * @param shaderOrOperation WebGL fragment shader or FIM operation to execute
   * @param destCoords If set, renders the output to the specified destination coordinates. By default, the destination
   *    is the full image. Note that the coordinates use the top-left as the origin, to be consistent with all other FIM
   *    API parameters, despite WebGL typically using bottom-left.
   */
  executeAsync(shaderOrOperation: FimShader | FimOperation, destCoords?: FimRect): Promise<void>;

  /**
   * Exports the image contents to an array of RGBA pixels
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   * @returns An array containing 4 bytes per pixel, in RGBA order
   */
  exportToPixelDataAsync(srcCoords?: FimRect): Promise<Uint8ClampedArray>;

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
