// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeDispatcherOpcodes } from './NodeDispatcherOpcodes';
import { DispatcherCommandBase } from '@leosingleton/fim/internals';

/** Command to create a new image by handle */
export interface CommandNodeCreate extends DispatcherCommandBase {
  opcode: NodeDispatcherOpcodes.Create;

  /** Handle for the new FIM instance */
  fimHandle: string;
}
