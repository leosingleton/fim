// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fileRead } from './FileRead';
import { FimNodeImage } from '../api/FimNodeImage';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { loadFromFileAsync } from '../core/LoadFromFile';
import { FimDimensions, FimImageOptions, FimObject, FimRect } from '@leosingleton/fim';
import { CoreCanvas2D, EngineImage } from '@leosingleton/fim/internals';
import { Canvas } from 'canvas';

export class NodeEngineImage extends EngineImage implements FimNodeImage {
  public async loadFromPngFileAsync(pngPath: string, allowRescale?: boolean): Promise<void> {
    const pngFile = await fileRead(pngPath);
    await this.loadFromPngAsync(pngFile, allowRescale);
  }

  public async loadFromJpegFileAsync(jpegPath: string, allowRescale?: boolean): Promise<void> {
    const jpegFile = await fileRead(jpegPath);
    await this.loadFromPngAsync(jpegFile, allowRescale);
  }

  public exportToCanvasAsync(canvas: Canvas, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    return this.exportToCanvasHelperAsync(async (srcImage: CoreCanvas2D, srcCoords: FimRect, destCoords: FimRect) => {
      (srcImage as CoreNodeCanvas2D).exportToCanvas(canvas, srcCoords, destCoords);
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
      name?: string): Promise<NodeEngineImage> {
    let result: NodeEngineImage;

    await loadFromFileAsync(pngFile, async img => {
      const dimensions = FimDimensions.fromWidthHeight(img.width, img.height);
      result = new NodeEngineImage(parent, options, dimensions, name);
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
      name?: string): Promise<NodeEngineImage> {
    let result: NodeEngineImage;

    await loadFromFileAsync(jpegFile, async img => {
      const dimensions = FimDimensions.fromWidthHeight(img.width, img.height);
      result = new NodeEngineImage(parent, options, dimensions, name);
      await result.loadFromPngAsync(jpegFile);
    });

    return result;
  }
}
