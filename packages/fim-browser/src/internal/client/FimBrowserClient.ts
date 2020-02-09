// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImageClient } from './FimBrowserImageClient';
import { FimBrowser } from '../../api/FimBrowser';
import { BrowserDispatcherOpcodes } from '../commands/BrowserDispatcherOpcodes';
import { CommandBrowserCreate } from '../commands/CommandBrowserCreate';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { FimClient, DispatcherCommand } from '@leosingleton/fim/internals';

/** Client implementation of the Fim interface for running in web browsers */
export class FimBrowserClient extends FimClient<FimBrowserImageClient> implements FimBrowser {
  protected sendCreateCommand(): void {
    // The Create command is special and is sent from the contructor itself. It simply informs the backend of the handle
    // of the new FIM instance and comes from an undefined parent object.
    const command: CommandBrowserCreate & DispatcherCommand = {
      sequenceNumber: 0,
      handle: undefined,
      opcode: BrowserDispatcherOpcodes.Create,
      fimHandle: this.handle,
      optimizationHints: {
        canQueue: true
      }
    };
    super.dispatchCommand(command);
  }

  protected createImageClient(dimensions: FimDimensions, options: FimImageOptions, imageName: string):
      FimBrowserImageClient {
    return new FimBrowserImageClient(this, this.dispatcher, dimensions, options, imageName);
  }
}
