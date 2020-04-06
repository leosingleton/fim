// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImage } from '../api/FimBrowserImage';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { FimRect } from '@leosingleton/fim';
import { CoreCanvas2D, EngineImage } from '@leosingleton/fim/internals';

/** Implementation of `EngineImage` for web browsers */
export class BrowserEngineImage extends EngineImage implements FimBrowserImage {
  public exportToCanvasAsync(canvas: HTMLCanvasElement, srcCoords?: FimRect, destCoords?: FimRect): Promise<void> {
    return this.exportToCanvasHelperAsync(async (srcImage: CoreCanvas2D, srcCoords: FimRect, destCoords: FimRect) => {
      (srcImage as CoreBrowserCanvas2D).exportToCanvas(canvas, srcCoords, destCoords);
    }, srcCoords, destCoords);
  }
}
