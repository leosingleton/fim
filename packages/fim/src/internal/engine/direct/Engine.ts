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

/** Low-level FIM rendering engine */
export abstract class Engine<TEngineFim extends EngineFim<TEngineImage>, TEngineImage extends EngineImage>
    extends EngineObject implements Dispatcher {
  /** Constructor */
  public constructor() {
    // This is the root object
    super(FimObjectType.Engine);
  }

  /** The FIM rendering engine does not hold any resources directly--the child objects do. */
  protected releaseOwnResources(): void { }

  public dispatchCommand(command: DispatcherCommand): void {
    // Check whether tracing is enabled and log the command. The logic here is a bit tricky as the tracing configuration
    // lives on the FIM instance, not global. So first try to get the FIM instance to read the tracing settings.
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

    try {
      // Attempt to execute the command
      const destObject = command.targetHandle ? this.getChildByHandle<EngineObject>(command.targetHandle) : this;
      const result = destObject.executeCommand(command);

      // Return the successful result
      resultObject.commandResult = result;
      this.onCommandResult(resultObject);
    } catch (err) {
      // Return the error
      resultObject.commandError = FimError.fromError(err);
      this.onCommandResult(resultObject);
    }
  }

  public onCommandResult: (result: DispatcherResult) => void;

  public executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      case DispatcherOpcodes.Create:
        return this.commandCreate(command as any as CommandCreate);

      case DispatcherOpcodes.ExecutionBarrier:
        return null;

      default:
        return super.executeCommand(command);
    }
  }

  private commandCreate(command: CommandCreate): void {
    const fim = this.createEngineFim(command.fimShortHandle);
    this.addChild(fim);
  }

  /** Derived classes must implement this method to call the TEngineFim constructor */
  protected abstract createEngineFim(handle: string): TEngineFim;
}
