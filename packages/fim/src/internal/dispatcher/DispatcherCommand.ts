// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from './DispatcherCommandBase';

/** Base class for all FIM engine commands */
export interface DispatcherCommand extends DispatcherCommandBase {
  /** Sequence number assigned to each command */
  sequenceNumber: number;

  /** Full handle of the object to execute the command */
  longHandle: string;
}
