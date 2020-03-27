// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowser } from '../api/FimBrowser';
import { BrowserEngineFim } from '../engine/BrowserEngineFim';
import { FimDimensions } from '@leosingleton/fim';

export namespace FimBrowserFactory {
  /**
   * Creates an instance of the FimBrowser interface
   * @param maxImageDimensions Maximum dimensions of any image
   * @param name An optional name specified when creating the object to help with debugging
   */
  export function create(maxImageDimensions: FimDimensions, name?: string): FimBrowser {
    return new BrowserEngineFim(maxImageDimensions, name);
  }
}
