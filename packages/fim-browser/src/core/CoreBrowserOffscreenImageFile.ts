// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserImageFile } from './CoreBrowserImageFile';
import { CoreBrowserOffscreenCanvas2D } from './CoreBrowserOffscreenCanvas2D';
import { CoreMimeType } from '@leosingleton/fim/internals';

/** Implementation of `CoreImageFile` for `CoreBrowserOffscreenCanvas2D` */
export class CoreBrowserOffscreenImageFile extends CoreBrowserImageFile {
  protected convertToBlobAsync(canvas: CoreBrowserOffscreenCanvas2D, type: CoreMimeType, quality?: number):
      Promise<Blob> {
    return canvas.canvasElement.convertToBlob({ type, quality });
  }

  /** Shared global instance */
  public static readonly instance = new CoreBrowserOffscreenImageFile();
}
