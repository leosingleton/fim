// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage, FimRect } from '@leosingleton/fim';
import { Canvas } from 'canvas';

/** Represents an image and its data within the FIM library. Implemented for running in Node.js. */
export interface FimNodeImage extends FimImage {
  /**
   * Exports the image contents to a canvas
   * @param canvas Destination canvas
   * @param srcCoords Source coordinates to export, in pixels. If unspecified, the full image is exported.
   * @param destCoords Destination coordinates to render to. If unspecified, the output is stretched to fit the entire
   *    canvas.
   */
  exportToCanvasAsync(canvas: Canvas, srcCoords?: FimRect, destCoords?: FimRect): Promise<void>;
}
