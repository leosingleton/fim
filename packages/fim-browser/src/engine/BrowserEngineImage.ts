// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fileDownload } from './FileDownload';
import { FimBrowserImage } from '../api/FimBrowserImage';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { FimRect } from '@leosingleton/fim';
import { CoreCanvas2D, EngineImage } from '@leosingleton/fim/internals';

/** Implementation of `EngineImage` for web browsers */
export class BrowserEngineImage extends EngineImage implements FimBrowserImage {
  public async loadFromPngFileAsync(pngUrl: string, allowRescale?: boolean): Promise<void> {
    const pngFile = await fileDownload(pngUrl);
    await this.loadFromPngAsync(pngFile, allowRescale);
  }

  public async loadFromJpegFileAsync(jpegUrl: string, allowRescale?: boolean): Promise<void> {
    const jpegFile = await fileDownload(jpegUrl);
    await this.loadFromJpegAsync(jpegFile, allowRescale);
  }

  public exportToCanvasAsync(canvas: HTMLCanvasElement, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    return this.exportToCanvasHelperAsync(async (srcImage: CoreCanvas2D, srcCoords: FimRect, destCoords: FimRect) => {
      (srcImage as CoreBrowserCanvas2D).exportToCanvas(canvas, srcCoords, destCoords);
    }, srcCoords, destCoords);
  }
}
