// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas, CoreTexture } from '@leosingleton/fim/internals';

/** Implementation of `CoreTexture` for Node.js */
export class CoreNodeTexture extends CoreTexture {
  protected copyFromInternal(_srcCanvas: CoreCanvas): void {
    // BUGBUG: Not implemented!
  }
}
