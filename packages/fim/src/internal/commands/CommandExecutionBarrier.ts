// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { DispatcherOpcodes } from './DispatcherOpcodes';

/** Dispatches all pending commands to exectuion pipeline and blocks until they complete */
export interface CommandExecutionBarrier extends DispatcherCommandBase {
  opcode: DispatcherOpcodes.ExecutionBarrier;
}
