// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNode } from '../api/FimNode';
import { NodeEngineFim } from '../engine/NodeEngineFim';
import { FimDimensions } from '@leosingleton/fim';

export namespace FimNodeFactory {
  /**
   * Creates an instance of the FimNode interface
   * @param maxImageDimensions Maximum dimensions of any image
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  export function create(maxImageDimensions: FimDimensions, objectName?: string): FimNode {
    return new NodeEngineFim(maxImageDimensions, objectName);
  }
}
