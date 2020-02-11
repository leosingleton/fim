// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimReleaseResourcesFlags } from '@leosingleton/fim';
import { CoreCanvas } from '@leosingleton/fim/internals';
import { Canvas/*, createCanvas, createImageData*/ } from 'canvas';

/** Wrapper around the Node.js canvas library */
export class CoreNodeCanvas extends CoreCanvas<Canvas> {
  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    throw new Error('not implemented');
  }
}
