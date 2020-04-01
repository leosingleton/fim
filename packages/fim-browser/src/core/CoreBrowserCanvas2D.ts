// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimRect } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/internals';

/** Wrapper around `CoreCanvas2D` to add browser-specific methods */
export abstract class CoreBrowserCanvas2D extends CoreCanvas2D {
  /**
   * Exports the canvas contents to another canvas
   * @param canvas Destination canvas
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   * @param destCoords Destination coordinates to render to. If unspecified, the output is stretched to fit the entire
   *    canvas.
   */
  public exportToCanvas(canvas: HTMLCanvasElement, srcCoords?: FimRect, destCoords?: FimRect): void {
    this.exportToCanvasHelper(canvas.getContext('2d'), canvas.width, canvas.height, srcCoords, destCoords);
  }
}
