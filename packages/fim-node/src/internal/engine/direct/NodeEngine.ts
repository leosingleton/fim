// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineFim } from './NodeEngineFim';
import { NodeEngineImage } from './NodeEngineImage';
import { Engine } from '@leosingleton/fim/internals';

/** Low-level FIM rendering engine for Node.js */
export class NodeEngine extends Engine<NodeEngineFim, NodeEngineImage> {
  protected createEngineFim(shortHandle: string): NodeEngineFim {
    return new NodeEngineFim(shortHandle, this);
  }
}
