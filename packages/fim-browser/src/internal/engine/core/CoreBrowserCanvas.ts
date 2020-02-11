// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas, RenderingContext2D } from '@leosingleton/fim/internals';

/** Wrapper around the HTML DOM canvas */
export class CoreBrowserCanvas extends CoreCanvas {
  public dispose() {
  }

  protected getContext2D(): RenderingContext2D {
    throw new Error('not implemented');
  }
}
