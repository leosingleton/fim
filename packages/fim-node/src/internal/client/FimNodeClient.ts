// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeImageClient } from './FimNodeImageClient';
import { FimNode } from '../../api/FimNode';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { FimClient } from '@leosingleton/fim/internals';

/** Client implementation of the Fim interface for running in Node.js */
export class FimNodeClient extends FimClient<FimNodeImageClient> implements FimNode {
  protected createImageClient(dimensions: FimDimensions, options: FimImageOptions, imageName: string):
      FimNodeImageClient {
    return new FimNodeImageClient(this, this.dispatcherClient, dimensions, options, imageName);
  }
}
