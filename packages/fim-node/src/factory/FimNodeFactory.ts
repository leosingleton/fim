// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNode } from '../api/FimNode';
import { FimNodeClient } from '../internal/client/FimNodeClient';
import { NodeEngine } from '../internal/engine/direct/NodeEngine';
import { FimDimensions, FimFactoryOptions } from '@leosingleton/fim';
import { OptimizerQueue, defaultFactoryOptions, mergeFactoryOptions } from '@leosingleton/fim/build/internal';

export namespace FimNodeFactory {
  /**
   * Creates an instance of the FimNode interface
   * @param maxImageDimensions Maximum dimensions of any image
   * @param objectName An optional name specified when creating the object to help with debugging
   * @param options Optional configuration settings for the FIM factory
   */
  export function create(maxImageDimensions: FimDimensions, objectName?: string, options?: FimFactoryOptions): FimNode {
    // Support default options
    options = mergeFactoryOptions(defaultFactoryOptions, options);

    const engine = new NodeEngine();
    const next = options.disableOptimizations ? engine : new OptimizerQueue(engine);
    const client = new FimNodeClient(next, maxImageDimensions, objectName);
    return client;
  }
}
