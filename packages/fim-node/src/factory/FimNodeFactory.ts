// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNode } from '../api/FimNode';
import { NodeEngineFim } from '../engine/NodeEngineFim';

/** Factory methods for instantiating the FIM library in Node.js */
export namespace FimNodeFactory {
  /**
   * Creates an instance of the FimNode interface
   * @param name An optional name specified when creating the object to help with debugging
   */
  export function create(name?: string): FimNode {
    return new NodeEngineFim(name);
  }
}
