// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowser } from '../api/FimBrowser';
import { BrowserEngineFim } from '../engine/BrowserEngineFim';

/** Factory methods for instantiating the FIM library in web browsers */
export namespace FimBrowserFactory {
  /**
   * Creates an instance of the FimBrowser interface
   * @param name An optional name specified when creating the object to help with debugging
   */
  export function create(name?: string): FimBrowser {
    return new BrowserEngineFim(name);
  }
}
