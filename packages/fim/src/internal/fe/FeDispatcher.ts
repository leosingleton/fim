// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FcCmd } from '../fc/FcCmd';
import { FimError } from '../../primitives/FimError';

/** Interface for dispatching commands to a FIM Engine */
export interface FeDispatcher {
  /**
   * Asynchronously dispatches a command to a back-end FIM engine
   * @param cmd Command to dispatch
   * @returns Unique ID identifying the dispatched command. May be used with waitForResponse() to get a result.
   */
  dispatchCommand(cmd: FcCmd): number;

  /**
   * Blocks until and returns the result of a FIM engine command
   * @param cmdID Return value from dispatchCommand()
   * @returns Result (any)
   */
  waitForResponse(cmdID: number): Promise<any>;

  /** Callback executed whenever the back-end FIM implementation encounters an error */
  errorHandler: (err: FimError) => void;
}