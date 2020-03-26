// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineFim } from './NodeEngineFim';
import { loadFromFileAsync } from '../core/LoadFromFile';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { EngineImage } from '@leosingleton/fim/internals';

export class NodeEngineImage extends EngineImage {
  /**
   * Creates a new BrowserEngineImage from a PNG file
   * @param fim Parent FIM object
   * @param pngFile PNG file, as a Uint8Array
   * @param options Overrides to the image options from the parent Fim object
   * @param imageName Optional name specified when creating the object to help with debugging
   */
  public static async createFromPngAsync(fim: NodeEngineFim, pngFile: Uint8Array, options: FimImageOptions,
      imageName?: string): Promise<NodeEngineImage> {
    let result: NodeEngineImage;

    await loadFromFileAsync(pngFile, async img => {
      const dimensions = FimDimensions.fromWidthHeight(img.width, img.height);
      result = new NodeEngineImage(fim, options, dimensions, imageName);
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
  public static async createFromJpegAsync(fim: NodeEngineFim, jpegFile: Uint8Array, options: FimImageOptions,
      imageName?: string): Promise<NodeEngineImage> {
    let result: NodeEngineImage;

    await loadFromFileAsync(jpegFile, async img => {
      const dimensions = FimDimensions.fromWidthHeight(img.width, img.height);
      result = new NodeEngineImage(fim, options, dimensions, imageName);
      await result.loadFromPngAsync(jpegFile);
    });

    return result;
  }
}
