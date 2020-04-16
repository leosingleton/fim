// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImage } from '../api/FimBrowserImage';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { loadFromBlobAsync } from '../core/ImageLoader';
import { FimDimensions, FimError, FimRect } from '@leosingleton/fim';
import { CoreCanvas2D, CoreMimeType, EngineImage } from '@leosingleton/fim/internals';

/** Implementation of `EngineImage` for web browsers */
export class BrowserEngineImage extends EngineImage implements FimBrowserImage {
  public loadFromBlobAsync(blob: Blob, allowRescale?: boolean): Promise<void> {
    const me = this;

    return loadFromBlobAsync(blob, image => {
      // If allowRescale is disabled, explicitly check the dimensions here. We can't pass allowRescale parameter down
      // to CoreCanvas2D.loadFromImage, because it may be a different set of dimensions due to auto-downscaling.
      const imageDimensions = FimDimensions.fromObject(image);
      if (!allowRescale && !imageDimensions.equals(me.dim)) {
        FimError.throwOnInvalidDimensions(me.dim, imageDimensions);
      }

      me.loadFromImage(image);
    });
  }

  public exportToCanvasAsync(canvas: HTMLCanvasElement, srcCoords?: FimRect, destCoords?: FimRect,
      allowOversizedDest?: boolean): Promise<void> {
    return this.exportToCanvasHelperAsync(async (srcImage: CoreCanvas2D, scaledSrcCoords: FimRect) => {
      (srcImage as CoreBrowserCanvas2D).exportToCanvas(canvas, scaledSrcCoords, destCoords, allowOversizedDest);
    }, srcCoords);
  }

  public exportToPngBlobAsync(): Promise<Blob> {
    return this.exportToInternalAsync(srcCanvas =>
      (srcCanvas as CoreBrowserCanvas2D).convertToBlobAsync(CoreMimeType.PNG));
  }

  public exportToJpegBlobAsync(quality?: number): Promise<Blob> {
    return this.exportToInternalAsync(srcCanvas =>
      (srcCanvas as CoreBrowserCanvas2D).convertToBlobAsync(CoreMimeType.JPEG, quality));
  }
}
