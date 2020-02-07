// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { FimExecutionOptions } from '../../api/FimExecutionOptions';

/** Updates the execution options on a FIM object */
export interface CommandSetExecutionOptions extends DispatcherCommandBase {
  command: 'SetExecutionOptions';

  /** Options for the FIM execution engine */
  executionOptions: FimExecutionOptions;
}
