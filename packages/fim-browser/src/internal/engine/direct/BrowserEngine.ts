// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserEngineFim } from './BrowserEngineFim';
import { BrowserEngineImage } from './BrowserEngineImage';
import { DispatcherCommand, Engine } from '@leosingleton/fim/internals';

/** Low-level FIM rendering engine for web browser */
export class BrowserEngine extends Engine<BrowserEngineFim, BrowserEngineImage> {
  protected createEngineFim(handle: string): BrowserEngineFim {
    return new BrowserEngineFim(handle, this);
  }

  public executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      default:
        // For all other commands, fall through to the parent class
        return super.executeCommand(command);
    }
  }
}
