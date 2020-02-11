// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Dispatcher } from '../../dispatcher/Dispatcher';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { DispatcherResult } from '../../dispatcher/DispatcherResult';
import { Queue } from '@leosingleton/commonlibs';

/** Layer that can be added to the Dispatcher stack to queue commands and results */
export class QueueOptimizer implements Dispatcher {
  /**
   * Constructor
   * @param nextDispatcher Next dispatcher in the chain
   */
  public constructor(nextDispatcher: Dispatcher) {
    // Chain ourselves to the next dispatcher
    nextDispatcher.onCommandResult = (result) => { this.onCommandResultInternal(result); };
    this.nextDispatcher = nextDispatcher;
  }

  public dispatchCommand(command: DispatcherCommand): void {
    const queue = this.commandQueue;

    if (command.optimizationHints.canQueue) {
      // This command can be queued
      queue.enqueue(command);
    } else {
      // This command cannot be queued. Flush the queue then dispatch it.
      const next = this.nextDispatcher;

      while (!queue.isEmpty()) {
        next.dispatchCommand(queue.dequeue());
      }

      next.dispatchCommand(command);
    }
  }

  private onCommandResultInternal(result: DispatcherResult): void {
    const queue = this.resultQueue;

    if (!result.commandError && !result.commandResult) {
      // This result can be queued
      queue.enqueue(result);
    } else {
      // This result cannot be queued. Flush the queue then dispatch it.
      while (!queue.isEmpty()) {
        this.onCommandResult(queue.dequeue());
      }

      this.onCommandResult(result);
    }
  }

  public onCommandResult: (result: DispatcherResult) => void;

  /** Next dispatcher in the chain */
  public readonly nextDispatcher: Dispatcher;

  /** Queue of commands to dispatch */
  private commandQueue = new Queue<DispatcherCommand>();

  /** Queue of results to return */
  private resultQueue = new Queue<DispatcherResult>();
}
