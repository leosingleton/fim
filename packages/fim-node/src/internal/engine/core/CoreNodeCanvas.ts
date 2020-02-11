// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas, RenderingContext2D } from '@leosingleton/fim/internals';

/** Wrapper around the Node.js canvas library */
export class CoreNodeCanvas extends CoreCanvas {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string) {
    super(canvasDimensions, imageHandle);
  }

  public dispose() {
  }

  protected getContext2D(): RenderingContext2D {
    throw new Error('not implemented');
  }
}
