// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { FimError } from '../../../primitives/FimError';
import { FimObjectType } from '../../client/FimObjectType';
import { CommandCreate } from '../../commands/CommandCreate';
import { DispatcherOpcodes } from '../../commands/DispatcherOpcodes';
import { Dispatcher } from '../../dispatcher/Dispatcher';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { DispatcherResult } from '../../dispatcher/DispatcherResult';
import { HandleBuilder } from '../../dispatcher/HandleBuilder';
import { AsyncAutoResetEvent, Task, Queue } from '@leosingleton/commonlibs';

/** Low-level FIM rendering engine */
export abstract class Engine<TEngineFim extends EngineFim<TEngineImage>, TEngineImage extends EngineImage>
    extends EngineObject implements Dispatcher {
  /** Constructor */
  public constructor() {
    // This is the root object
    super(FimObjectType.Engine);

    // Start the dispatcher thread. We execute all of the commands in a single thread using the JavaScript async
    // pattern.
    Task.runAsyncVoid(() => this.dispatcherThread());
  }

  /** The FIM rendering engine does not hold any resources directly--the child objects do. */
  protected releaseOwnResources(): void { }

  public dispatchCommand(command: DispatcherCommand): void {
    // Enqueue the command and signal the dispatcher thread to wake up and process it
    this.dispatcherQueue.enqueue(command);
    this.dispatcherQueueNotEmpty.setEvent();
  }

  public onCommandResult: (result: DispatcherResult) => void;

  /** Queue of commands to be processed by the dispatcher thread */
  private dispatcherQueue = new Queue<DispatcherCommand>();

  /** Event to wake the dispatcher thread when the `dispatcherQueue` is not empty */
  private dispatcherQueueNotEmpty = new AsyncAutoResetEvent();

  /** Background thread to execute commands from the `dispatcherQueue` */
  private async dispatcherThread(): Promise<never> {
    const queue = this.dispatcherQueue;

    while (true) {
      while (!queue.isEmpty()) {
        const command = queue.dequeue();

        // Check whether tracing is enabled and log the command. The logic here is a bit tricky as the tracing
        // configuration lives on the FIM instance, not global. So first try to get the FIM instance to read the
        // tracing settings.
        const fimHandle = HandleBuilder.getHandleAtPosition(command.targetHandle, 1);
        if (fimHandle) {
          const fim = this.getChildByHandle<EngineFim<TEngineImage>>(fimHandle);
          if (fim.executionOptions.showTracing) {
            console.log('Dispatch', command);
          }
        }

        // Populate required fields of any result
        const resultObject: DispatcherResult = {
          sequenceNumber: command.sequenceNumber,
          opcode: command.opcode
        };

        // Attempt to execute the command
        const destObject = command.targetHandle ? this.getChildByHandle<EngineObject>(command.targetHandle) : this;
        try {
          const result = await destObject.executeCommand(command);

          // Return the successful result
          resultObject.commandResult = result;
          this.onCommandResult(resultObject);
        } catch (err) {
          // Return the error
          resultObject.commandError = FimError.fromError(err);
          this.onCommandResult(resultObject);
        }
      }

      await this.dispatcherQueueNotEmpty.waitAsync();
    }
  }

  public executeCommand(command: DispatcherCommand): Promise<any> {
    switch (command.opcode) {
      case DispatcherOpcodes.Create:
        return this.commandCreate(command as any as CommandCreate);

      case DispatcherOpcodes.ExecutionBarrier:
        return Promise.resolve();

      default:
        return super.executeCommand(command);
    }
  }

  private async commandCreate(command: CommandCreate): Promise<void> {
    const fim = this.createEngineFim(command.fimShortHandle);
    this.addChild(fim);
  }

  /** Derived classes must implement this method to call the TEngineFim constructor */
  protected abstract createEngineFim(handle: string): TEngineFim;
}
