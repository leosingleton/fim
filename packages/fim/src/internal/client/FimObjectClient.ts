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
import { DispatcherResult } from '../dispatcher/DispatcherResult';
import { HandleBuilder } from '../dispatcher/HandleBuilder';
import { DispatcherOpcodes } from '../commands/DispatcherOpcodes';
import { AsyncManualResetEvent } from '@leosingleton/commonlibs';

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

    // Register our result handler with the dispatcher
    dispatcher.onCommandResult = (result) => { this.onCommandResult(result); };
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
    const fullCommand = this.buildCommandForDispatch(command);
    this.dispatcher.dispatchCommand(fullCommand);
  }

  /** Helper function for dispatchCommand() and dispatchCommandAndWaitAsync() */
  private buildCommandForDispatch(command: DispatcherCommandBase): DispatcherCommand {
    const dispatcher = this.dispatcher;
    const handle = this.handle;

    if (!dispatcher) {
      throw new FimError(FimErrorCode.AppError, `${handle} is disposed`);
    }

    // Add additional properties
    const fullCommand = command as DispatcherCommand;
    fullCommand.longHandle = this.longHandle;
    fullCommand.sequenceNumber = this.sequenceNumber++;

    return fullCommand;
  }

  /** Sequence number for dispatching commands */
  private sequenceNumber = 0;

  /**
   * Dispatches a command to the back-end rendering engine and blocks until it completes
   * @param command Command to dispatch
   * @returns Result of the command
   */
  protected async dispatchCommandAndWaitAsync(command: DispatcherCommandBase): Promise<any> {
    const fullCommand = this.buildCommandForDispatch(command);

    // Build and register a waiter object
    const waiter = new FimObjectClientWaiter();
    this.waiters[fullCommand.sequenceNumber] = waiter;

    this.dispatcher.dispatchCommand(fullCommand);

    // Wait for and return the result
    await waiter.doneEvent.waitAsync();
    return waiter.result;
  }

  /** Hash table of sequence numbers to waiters on executing commands */
  private waiters: FimObjectClientWaiterMap = {};

  private onCommandResult(_result: DispatcherResult): void {

  }
}

/**
 * Helper object for FimObjectClient used to hold a single command call while it is blocked waiting on a response from
 * the backend.
 */
export class FimObjectClientWaiter {
  /** Event set when the command is done and a result is available */
  public readonly doneEvent = new AsyncManualResetEvent();

  /** Result of the command */
  public result?: any;
}

/** Hash table of sequence numbers to FimObjectClientWaiter instances */
export interface FimObjectClientWaiterMap {
  [sequenceNumber: number]: FimObjectClientWaiter
}
