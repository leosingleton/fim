// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImageClient } from './FimBrowserImageClient';
import { FimBrowser } from '../../api/FimBrowser';
import { CommandBrowserCreateImage } from '../commands/CommandBrowserCreateImage';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { FimClient } from '@leosingleton/fim/internals';

/** Client implementation of the Fim interface for running in web browsers */
export class FimBrowserClient extends FimClient implements FimBrowser {
  public createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string):
      FimBrowserImageClient {
    // Default values
    dimensions = dimensions ?? this.maxImageDimensions;
    options = options ?? {};

    // Dispatch the create command to the back-end
    const image = new FimBrowserImageClient(this, this.dispatcher, dimensions, options, imageName);
    const command: CommandBrowserCreateImage = {
      command: 'BrowserCreateImage',
      imageDimensions: dimensions,
      imageHandle: image.handle,
      optimizationHints: {
        canQueue: true
      }
    };
    this.dispatchCommand(command);

    return image;
  }
}
