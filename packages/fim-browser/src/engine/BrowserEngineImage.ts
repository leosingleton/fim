// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImage } from '../api/FimBrowserImage';
import { CoreBrowser2D } from '../core/CoreBrowser2D';
import { loadFromFileAsync } from '../core/LoadFromFile';
import { FimImageOptions, FimDimensions, FimObject, FimRect } from '@leosingleton/fim';
import { CoreCanvas2D, CoreMimeType, EngineImage } from '@leosingleton/fim/internals';

export class BrowserEngineImage extends EngineImage implements FimBrowserImage {
  public exportToCanvasAsync(canvas: HTMLCanvasElement, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    return this.exportToCanvasHelperAsync(async (srcImage: CoreCanvas2D, srcCoords: FimRect, destCoords: FimRect) => {
      (srcImage as CoreBrowser2D).exportToCanvas(canvas, srcCoords, destCoords);
    }, srcCoords, destCoords);
  }

  /**
   * Creates a new BrowserEngineImage from a PNG file
   * @param parent Parent object
   * @param pngFile PNG file, as a Uint8Array
   * @param options Overrides to the image options from the parent Fim object
   * @param name Optional name specified when creating the object to help with debugging
   */
  public static async createFromPngAsync(parent: FimObject, pngFile: Uint8Array, options: FimImageOptions,
      name?: string): Promise<BrowserEngineImage> {
    let result: BrowserEngineImage;

    await loadFromFileAsync(pngFile, CoreMimeType.PNG, async img => {
      const dimensions = FimDimensions.fromWidthHeight(img.width, img.height);
      result = new BrowserEngineImage(parent, options, dimensions, name);
      await result.loadFromPngAsync(pngFile);
    });

    return result;
  }

  /**
   * Creates a new BrowserEngineImage from a JPEG file
   * @param parent Parent object
   * @param jpegFile JPEG file, as a Uint8Array
   * @param options Overrides to the image options from the parent Fim object
   * @param name Optional name specified when creating the object to help with debugging
   */
  public static async createFromJpegAsync(parent: FimObject, jpegFile: Uint8Array, options: FimImageOptions,
      name?: string): Promise<BrowserEngineImage> {
    let result: BrowserEngineImage;

    await loadFromFileAsync(jpegFile, CoreMimeType.JPEG, async img => {
      const dimensions = FimDimensions.fromWidthHeight(img.width, img.height);
      result = new BrowserEngineImage(parent, options, dimensions, name);
      await result.loadFromPngAsync(jpegFile);
    });

    return result;
  }
}
