// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImageClient } from './FimBrowserImageClient';
import { FimBrowser } from '../../api/FimBrowser';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { FimClient } from '@leosingleton/fim/internals';

/** Client implementation of the Fim interface for running in web browsers */
export class FimBrowserClient extends FimClient<FimBrowserImageClient> implements FimBrowser {
  protected createImageClient(dimensions: FimDimensions, options: FimImageOptions, imageName: string):
      FimBrowserImageClient {
    return new FimBrowserImageClient(this, this.dispatcher, dimensions, options, imageName);
  }
}
