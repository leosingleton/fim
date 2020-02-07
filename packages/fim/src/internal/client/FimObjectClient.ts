// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObject } from '../../api/FimObject';
import { FimReleaseResourcesFlags } from '../../api/FimReleaseResourcesFlags';
import { FimError, FimErrorCode } from '../../primitives/FimError';
import { CommandDispose } from '../commands/CommandDispose';
import { CommandReleaseResources } from '../commands/CommandReleaseResources';
import { Dispatcher } from '../dispatcher/Dispatcher';
import { DispatcherCommand } from '../dispatcher/DispatcherCommand';
import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { DispatcherOpcodes } from '../commands/DispatcherOpcodes';

/** Base class for all objects in the FIM API */
export abstract class FimObjectClient implements FimObject {
  /**
   * Base constructor for all objects in the FIM API
   * @param dispatcher Back-end FIM engine
   * @param objectType A short string indicating the object type, e.g. 'img' for FimImage
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  protected constructor(dispatcher: Dispatcher, objectType: string, objectName?: string) {
    // Create a globally-unique handle name. Although really, only the global handle count is needed, we add the object
    // type and name to make it easier to debug.
    this.handle = `${objectType}.${FimObjectClient.globalHandleCount++}`;
    if (objectName) {
      this.handle += `.${objectName}`;
    }

    this.dispatcher = dispatcher;
  }

  public readonly handle: string;

  /** Global counter used to assign a unique handle to objects in FIM */
  private static globalHandleCount = 0;

  /** Back-end FIM engine */
  protected dispatcher: Dispatcher;

  public releaseResources(flags: FimReleaseResourcesFlags): void {
    const command: CommandReleaseResources = {
      opcode: DispatcherOpcodes.ReleaseResourcs,
      flags,
      optimizationHints: {
        canQueue: true
      }
    };
    this.dispatchCommand(command);
  }

  public releaseAllResources(): void {
    this.releaseResources(FimReleaseResourcesFlags.All);
  }

  public dispose(): void {
    const command: CommandDispose = {
      opcode: DispatcherOpcodes.Dispose,
      optimizationHints: {
        canQueue: true
      }
    };
    this.dispatchCommand(command);

    delete this.dispatcher;
  }

  /**
   * Dispatches a command to the back-end rendering engine
   * @param command Command to dispatch
   */
  protected dispatchCommand(command: DispatcherCommandBase): void {
    const dispatcher = this.dispatcher;
    const handle = this.handle;

    if (!dispatcher) {
      throw new FimError(FimErrorCode.AppError, `${handle} is disposed`);
    }

    // Add additional properties
    const fullCommand = command as DispatcherCommand;
    fullCommand.handle = this.handle;
    fullCommand.sequenceNumber = this.sequenceNumber++;

    dispatcher.dispatchCommand(fullCommand);
  }

  /** Sequence number for dispatching commands */
  private sequenceNumber = 0;
}
