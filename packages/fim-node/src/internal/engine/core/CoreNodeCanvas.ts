// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeOffscreenCanvas } from './NodeOffscreenCanvas';
import { FimReleaseResourcesFlags } from '@leosingleton/fim';
import { CoreCanvas } from '@leosingleton/fim/internals';

/** Wrapper around the Node.js canvas library */
export class CoreNodeCanvas extends CoreCanvas<NodeOffscreenCanvas> {
  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    throw new Error('not implemented');
  }
}
