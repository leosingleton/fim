// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommand } from './DispatcherCommand';
import { DispatcherResult } from './DispatcherResult';

/** Interface for dispatching commands to a FIM Engine */
export interface Dispatcher {
  /**
   * Asynchronously dispatches a command to a back-end FIM engine
   * @param command Command to dispatch
   */
  dispatchCommand(command: DispatcherCommand): void;

  /**
   * Callback executed on each completed command
   * @param result Command results
   */
  onCommandResult: (result: DispatcherResult) => void;
}
