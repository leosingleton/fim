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
import { HandleBuilder } from '../dispatcher/HandleBuilder';
import { DispatcherOpcodes } from '../commands/DispatcherOpcodes';

/** Base class for all objects in the FIM API */
export abstract class FimObjectClient implements FimObject {
  /**
   * Base constructor for all objects in the FIM API
   * @param dispatcher Back-end FIM engine
   * @param objectType A short string indicating the object type, e.g. 'img' for FimImage
   * @param parentLongHandle Long handle of the parent object. Required if the object has a parent; may be undefined if
   *    this object is the root.
   * @param objectName Optional name specified when creating the object to help with debugging
   */
  protected constructor(dispatcher: Dispatcher, objectType: string, parentLongHandle?: string, objectName?: string) {
    // Create a globally-unique handle name
    this.handle = HandleBuilder.createObjectHandle(objectType, objectName);
    this.longHandle = HandleBuilder.createLongObjectHandle(parentLongHandle, this.handle);

    this.dispatcher = dispatcher;
  }

  public readonly handle: string;
  public readonly longHandle: string;

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
    fullCommand.longHandle = this.longHandle;
    fullCommand.sequenceNumber = this.sequenceNumber++;

    dispatcher.dispatchCommand(fullCommand);
  }

  /** Sequence number for dispatching commands */
  private sequenceNumber = 0;
}
