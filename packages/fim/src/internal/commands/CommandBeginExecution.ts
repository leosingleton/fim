// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { DispatcherOpcodes } from './DispatcherOpcodes';

/** Hint to dispatch all pending commands to execution pipeline */
export interface CommandBeginExecution extends DispatcherCommandBase {
  opcode: DispatcherOpcodes.BeginExecution;
}
