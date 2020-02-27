// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineFim } from './BrowserEngineFim';
import { loadFromFileAsync } from '../core/LoadFromFile';
import { FimImageOptions, FimDimensions } from '@leosingleton/fim';
import { CoreMimeType, EngineImage } from '@leosingleton/fim/internals';

export class BrowserEngineImage extends EngineImage {
  /**
   * Creates a new BrowserEngineImage from a PNG file
   * @param fim Parent FIM object
   * @param pngFile PNG file, as a Uint8Array
   * @param options Overrides to the image options from the parent Fim object
   * @param imageName Optional name specified when creating the object to help with debugging
   */
  public static async createFromPngAsync(fim: BrowserEngineFim, pngFile: Uint8Array, options: FimImageOptions,
      imageName?: string): Promise<BrowserEngineImage> {
    let result: BrowserEngineImage;

    await loadFromFileAsync(pngFile, CoreMimeType.PNG, async img => {
      const dimensions = FimDimensions.fromWidthHeight(img.width, img.height);
      result = new BrowserEngineImage(fim, dimensions, options, imageName);
      await result.loadFromPngAsync(pngFile);
    });

    return result;
  }

  /**
   * Creates a new BrowserEngineImage from a JPEG file
   * @param fim Parent FIM object
   * @param jpegFile JPEG file, as a Uint8Array
   * @param options Overrides to the image options from the parent Fim object
   * @param imageName Optional name specified when creating the object to help with debugging
   */
  public static async createFromJpegAsync(fim: BrowserEngineFim, jpegFile: Uint8Array, options: FimImageOptions,
      imageName?: string): Promise<BrowserEngineImage> {
        let result: BrowserEngineImage;

        await loadFromFileAsync(jpegFile, CoreMimeType.JPEG, async img => {
          const dimensions = FimDimensions.fromWidthHeight(img.width, img.height);
          result = new BrowserEngineImage(fim, dimensions, options, imageName);
          await result.loadFromPngAsync(jpegFile);
        });

        return result;
  }
}
