// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherOpcodes } from './DispatcherOpcodes';
import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';

/** Creates a new FIM instance */
export interface CommandCreate extends DispatcherCommandBase {
  opcode: DispatcherOpcodes.Create;

  /** Short handle for the new FIM instance */
  fimShortHandle: string;
}
