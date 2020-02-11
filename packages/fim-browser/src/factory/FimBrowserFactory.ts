// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowser } from '../api/FimBrowser';
import { FimBrowserClient } from '../internal/client/FimBrowserClient';
import { BrowserEngine } from '../internal/engine/direct/BrowserEngine';
import { FimDimensions } from '@leosingleton/fim';

export namespace FimBrowserFactory {
  /**
   * Creates an instance of the FimBrowser interface
   * @param maxImageDimensions Maximum dimensions of any image
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  export function create(maxImageDimensions: FimDimensions, objectName?: string): FimBrowser {
    const engine = new BrowserEngine();
    const client = new FimBrowserClient(engine, maxImageDimensions, objectName);
    return client;
  }
}
