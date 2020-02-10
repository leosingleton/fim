// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Dispatcher } from './Dispatcher';
import { DispatcherCommand } from './DispatcherCommand';
import { DispatcherCommandBase } from './DispatcherCommandBase';
import { DispatcherResult } from './DispatcherResult';
import { FimError, FimErrorCode } from '../../primitives/FimError';
import { AsyncManualResetEvent } from '@leosingleton/commonlibs';

/** Helper class for sending commands and waiting for results on the Dispatcher interface */
export class DispatcherClient {
  /**
   * Constructor
   * @param dispatcher Back-end FIM engine
   */
  public constructor(dispatcher: Dispatcher) {
    // Register our result handler with the dispatcher
    dispatcher.onCommandResult = (result) => { this.onCommandResult(result); };
    this.dispatcher = dispatcher;
  }

  /**
   * Dispatches a command to the back-end rendering engine
   * @param longHandle Long handle of the object to send the command to
   * @param command Command to dispatch
   */
  public dispatchCommand(longHandle: string, command: DispatcherCommandBase): void {
    const fullCommand = this.buildCommandForDispatch(longHandle, command);
    this.dispatcher.dispatchCommand(fullCommand);
  }

  /**
   * Dispatches a command to the back-end rendering engine and blocks until it completes
   * @param longHandle Long handle of the object to send the command to
   * @param command Command to dispatch
   * @returns Result of the command
   */
  public async dispatchCommandAndWaitAsync(longHandle: string, command: DispatcherCommandBase): Promise<any> {
    const fullCommand = this.buildCommandForDispatch(longHandle, command);

    // Build and register a waiter object
    const waiter = new ClientWaiter();
    this.waiters[fullCommand.sequenceNumber] = waiter;

    this.dispatcher.dispatchCommand(fullCommand);

    // Wait for and return the result
    await waiter.doneEvent.waitAsync();
    const result = waiter.result;
    if (result.commandError) {
      throw result.commandError;
    }
    return result.commandResult;
  }

  /** Helper function for dispatchCommand() and dispatchCommandAndWaitAsync() */
  private buildCommandForDispatch(longHandle: string, command: DispatcherCommandBase): DispatcherCommand {
    const dispatcher = this.dispatcher;
    if (!dispatcher) {
      throw new FimError(FimErrorCode.AppError, `${longHandle} is disposed`);
    }

    // Add additional properties
    const fullCommand = command as DispatcherCommand;
    fullCommand.longHandle = longHandle;
    fullCommand.sequenceNumber = this.sequenceNumber++;

    return fullCommand;
  }

  /** Callback registered with the Dispatcher interface */
  private onCommandResult(result: DispatcherResult): void {
    // Find the waiter object by sequence number. It is completely normal for none to be found, as most commands in FIM
    // are asynchronous.
    const waiter = this.waiters[result.sequenceNumber];
    if (waiter) {
      // Store the result and remove the object from the waiter map
      waiter.result = result;
      delete this.waiters[result.sequenceNumber];

      // Wake any waiters
      waiter.doneEvent.setEvent();
    } else {
      // TODO: Figure out how to handle errors returned to asynchronous commands!!!!!
      //throw new Error('not implemented');
    }
  }

  /** Back-end FIM engine */
  private dispatcher: Dispatcher;

  /** Sequence number for dispatching commands */
  private sequenceNumber = 0;

  /** Hash table of sequence numbers to waiters on executing commands */
  private waiters: ClientWaiterMap = {};
}

/**
 * Helper object for DispatcherClient used to hold a single command call while it is blocked waiting on a response from
 * the backend.
 */
class ClientWaiter {
  /** Event set when the command is done and a result is available */
  public readonly doneEvent = new AsyncManualResetEvent();

  /** Result of the command */
  public result: DispatcherResult;
}

/** Hash table of sequence numbers to ClientWaiter instances */
interface ClientWaiterMap {
  [sequenceNumber: number]: ClientWaiter
}
