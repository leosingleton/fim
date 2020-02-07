// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { DispatcherOpcodes } from './DispatcherOpcodes';

/** Disposes a FIM object */
export interface CommandDispose extends DispatcherCommandBase {
  opcode: DispatcherOpcodes.Dispose;
}
