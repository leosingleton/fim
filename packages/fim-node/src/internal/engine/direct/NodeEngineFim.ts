// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineImage } from './NodeEngineImage';
import { FimDimensions, FimReleaseResourcesFlags } from '@leosingleton/fim';
import { EngineFim } from '@leosingleton/fim/internals';

export class NodeEngineFim extends EngineFim<NodeEngineImage> {
  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    // TODO
  }

  protected createEngineImage(shortHandle: string, imageDimensions: FimDimensions): NodeEngineImage {
    return new NodeEngineImage(shortHandle, this, imageDimensions);
  }
}
