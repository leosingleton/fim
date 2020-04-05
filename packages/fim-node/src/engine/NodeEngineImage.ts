// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fileRead } from './FileRead';
import { FimNodeImage } from '../api/FimNodeImage';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { FimRect } from '@leosingleton/fim';
import { CoreCanvas2D, EngineImage } from '@leosingleton/fim/internals';
import { Canvas } from 'canvas';

/** Implementation of `EngineImage` for Node.js */
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
}
