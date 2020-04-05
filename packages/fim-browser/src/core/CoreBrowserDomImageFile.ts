// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserDomCanvas2D } from './CoreBrowserDomCanvas2D';
import { CoreBrowserImageFile } from './CoreBrowserImageFile';
import { CoreMimeType } from '@leosingleton/fim/internals';

/** Implementation of `CoreImageFile` for `CoreBrowserDomCanvas2D` */
export class CoreBrowserDomImageFile extends CoreBrowserImageFile {
  protected convertToBlobAsync(canvas: CoreBrowserDomCanvas2D, type: CoreMimeType, quality?: number): Promise<Blob> {
    return new Promise<Blob>(resolve => {
      canvas.canvasElement.toBlob(blob => resolve(blob), type, quality);
    });
  }

  /** Shared global instance */
  public static readonly instance = new CoreBrowserDomImageFile();
}
