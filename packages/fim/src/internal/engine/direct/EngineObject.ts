// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreObject } from '../core/CoreObject';
import { CommandDispose } from '../../commands/CommandDispose';
import { CommandReleaseResources } from '../../commands/CommandReleaseResources';
import { DispatcherOpcodes } from '../../commands/DispatcherOpcodes';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { FimError, FimErrorCode } from '../../../primitives/FimError';

/** Low-level FIM rendering engine */
export abstract class EngineObject extends CoreObject {
  /** Derived classes must overload this method to handle any commands they add to the FIM engine */
  public executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      case DispatcherOpcodes.Dispose:
        return this.disposeCommand(command as any as CommandDispose);

      case DispatcherOpcodes.ReleaseResources:
        return this.releaseResourcesCommand(command as any as CommandReleaseResources);

      default:
        throw new FimError(FimErrorCode.AppError, `Invalid op ${command.opcode}`);
    }
  }

  private disposeCommand(_command: CommandDispose): void {
    this.dispose();
  }

  private releaseResourcesCommand(command: CommandReleaseResources): void {
    this.releaseResources(command.flags);
  }
}
