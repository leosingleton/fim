// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CommandBase } from './CommandBase';

/** Disposes a FIM object */
export interface CommandDispose extends CommandBase {
  cmd: 'd';
}
