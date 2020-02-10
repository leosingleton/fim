// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreObject } from '../core/CoreObject';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { FimError, FimErrorCode } from '../../../primitives/FimError';

/** Low-level FIM rendering engine */
export abstract class EngineObject extends CoreObject {
  /** Derived classes must overload this method to handle any commands they add to the FIM engine */
  public abstract executeCommand(command: DispatcherCommand): any;

  /**
   * Helper function to throw an exception when an invalid opcode is received on an object
   * @param command Command received where opcode is invalid
   */
  protected throwInvalidOperation(command: DispatcherCommand): never {
    throw new FimError(FimErrorCode.AppError, `Invalid op ${command.opcode}`);
  }
}
