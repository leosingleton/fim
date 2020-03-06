// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { using } from '@leosingleton/commonlibs';
import { CoreCanvas, CoreCanvas2D, CoreTexture } from '@leosingleton/fim/internals';

/** Implementation of `CoreTexture` for Node.js */
export class CoreNodeTexture extends CoreTexture {
  protected copyFromInternal(srcCanvas: CoreCanvas): void {
    // headless-gl seems to have an issue when copying a texture from a canvas. Workaround by using an intermediate
    // binary buffer.
    if (!(srcCanvas instanceof CoreCanvas2D)) {
      // If srcCanvas is not a CoreCanvas2D, copy the contents to a temporary 2D canvas
      using(srcCanvas.createTemporaryCanvas2D(), temp => {
        temp.copyFrom(srcCanvas);
        this.copyFromInternal(temp);
      });
    } else {
      // srcCanvas is a CoreCanvas2D
      const pixelData = srcCanvas.exportToPixelData();
      this.loadPixelData(pixelData);
    }
  }
}
