// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Dispatcher } from '../../dispatcher/Dispatcher';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { DispatcherResult } from '../../dispatcher/DispatcherResult';
import { FimError, FimErrorCode } from '../../../primitives/FimError';

/** Low-level FIM rendering engine */
export abstract class Engine implements Dispatcher {
  public dispatchCommand(command: DispatcherCommand): void {
    // Populate required fields of any result
    const resultObject: DispatcherResult = {
      sequenceNumber: command.sequenceNumber,
      opcode: command.opcode
    };

    try {
      // Attempt to execute the command
      const result = this.executeCommand(command);

      // Return the successful result
      resultObject.commandResult = result;
      this.onCommandResult(resultObject);
    } catch (err) {
      // Return the error
      resultObject.commandError = err;
      this.onCommandResult(resultObject);
    }
  }

  public onCommandResult: (result: DispatcherResult) => void;

  /** Derived classes should overload this message to handle any commands they add to FIM */
  protected executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      default:
        throw new FimError(FimErrorCode.AppError, `Invalid op ${command.opcode}`);
    }
  }
}
