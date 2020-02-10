// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { DispatcherOpcodes } from './DispatcherOpcodes';

/** Command to return the value of one pixel */
export interface CommandImageGetPixel extends DispatcherCommandBase {
  opcode: DispatcherOpcodes.ImageGetPixel;

  /** X-offset, in pixels */
  x: number;

  /** Y-offset, in pixels */
  y: number;
}
