// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { usingAsync } from '@leosingleton/commonlibs';
import { CoreCanvas, CoreCanvas2D, CoreTexture } from '@leosingleton/fim/internals';

/** Implementation of `CoreTexture` for Node.js */
export class CoreNodeTexture extends CoreTexture {
  protected async copyFromInternalAsync(srcCanvas: CoreCanvas): Promise<void> {
    // headless-gl seems to have an issue when copying a texture from a canvas. Workaround by using an intermediate
    // binary buffer.
    if (!(srcCanvas instanceof CoreCanvas2D)) {
      // If srcCanvas is not a CoreCanvas2D, copy the contents to a temporary 2D canvas
      await usingAsync(srcCanvas.createTemporaryCanvas2D(), async temp => {
        await temp.copyFromAsync(srcCanvas);
        await this.copyFromInternalAsync(temp);
      });
    } else {
      // srcCanvas is a CoreCanvas2D
      const pixelData = srcCanvas.exportToPixelData();
      this.loadPixelData(pixelData);
    }
  }
}
