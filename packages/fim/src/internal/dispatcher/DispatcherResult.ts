// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimError } from '../../primitives/FimError';

/** Command results. Either commandResult or commandError will be sent depending on success or errror, respectively. */
export interface DispatcherResult {
  /** Sequence number provided in the command */
  sequenceNumber: number;

  /** Unique string identifying the operation to the FIM engine */
  opcode: string;

  /** On success, contains the output of the command */
  commandResult?: any;

  /** On failure, contains the exception that caused the command to fail */
  commandError?: FimError;
}
