// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserDispatcherOpcodes } from '../../commands/BrowserDispatcherOpcodes';
import { CommandBrowserCreate } from '../../commands/CommandBrowserCreate';
import { CommandBrowserCreateImage } from '../../commands/CommandBrowserCreateImage';
import { DispatcherCommand, Engine } from '@leosingleton/fim/internals';

/** Low-level FIM rendering engine for web browser */
export class BrowserEngine extends Engine {
  protected executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      case BrowserDispatcherOpcodes.Create:
        return this.create(command as any as CommandBrowserCreate);

      case BrowserDispatcherOpcodes.CreateImage:
        return this.createImage(command as any as CommandBrowserCreateImage);

      default:
        // For all other commands, fall through to the parent class
        return super.executeCommand(command);
    }
  }

  private create(_command: CommandBrowserCreate): void {
    // TODO
  }

  private createImage(_command: CommandBrowserCreateImage): void {
    // TODO
  }
}
