// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowser } from '../api/FimBrowser';
import { FimBrowserClient } from '../internal/client/FimBrowserClient';
import { BrowserEngine } from '../internal/engine/direct/BrowserEngine';
import { FimDimensions, FimFactoryOptions } from '@leosingleton/fim';
import { OptimizerQueue, defaultFactoryOptions, mergeFactoryOptions } from '@leosingleton/fim/build/internal';

export namespace FimBrowserFactory {
  /**
   * Creates an instance of the FimBrowser interface
   * @param maxImageDimensions Maximum dimensions of any image
   * @param objectName An optional name specified when creating the object to help with debugging
   * @param options Optional configuration settings for the FIM factory
   */
  export function create(maxImageDimensions: FimDimensions, objectName?: string,
      options?: FimFactoryOptions): FimBrowser {
    // Support default options
    options = mergeFactoryOptions(defaultFactoryOptions, options);

    const engine = new BrowserEngine();
    const next = options.disableOptimizations ? engine : new OptimizerQueue(engine);
    const client = new FimBrowserClient(next, maxImageDimensions, objectName);
    return client;
  }
}
