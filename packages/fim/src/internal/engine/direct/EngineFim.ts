// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Engine } from './Engine';
import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { FimExecutionOptions, defaultExecutionOptions } from '../../../api/FimExecutionOptions';
import { FimDimensions } from '../../../primitives/FimDimensions';
import { CommandCreateImage } from '../../commands/CommandCreateImage';
import { CommandSetExecutionOptions } from '../../commands/CommandSetExecutionOptions';
import { DispatcherOpcodes } from '../../commands/DispatcherOpcodes';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { deepCopy } from '@leosingleton/commonlibs';

/** Backend instance of the FIM engine */
export abstract class EngineFim<TEngineImage extends EngineImage> extends EngineObject {
  /**
   * Constructor
   * @param shortHandle Short handle of the new FIM object
   * @param engine Parent Engine instance
   */
  public constructor(shortHandle: string, engine: Engine<EngineFim<TEngineImage>, TEngineImage>) {
    super(shortHandle, engine);

    // Initialize the FIM execution options to defaults. We will use these until we receive a SetExecutionOptions
    // command.
    this.executionOptions = deepCopy(defaultExecutionOptions);
  }

  /** Options for the FIM execution engine */
  public readonly executionOptions: FimExecutionOptions;

  public executeCommand(command: DispatcherCommand): Promise<any> {
    switch (command.opcode) {
      case DispatcherOpcodes.CreateImage:
        return this.commandCreateImage(command as any as CommandCreateImage);

      case DispatcherOpcodes.SetExecutionOptions:
        return this.commandSetExecutionOptions(command as any as CommandSetExecutionOptions);

      default:
        return super.executeCommand(command);
    }
  }

  private async commandCreateImage(command: CommandCreateImage): Promise<void> {
    const image = this.createEngineImage(command.imageShortHandle, command.imageDimensions);
    this.addChild(image);
  }

  /** Derived classes must implement this method to call the TEngineImage constructor */
  protected abstract createEngineImage(shortHandle: string, imageDimensions: FimDimensions): TEngineImage;

  private async commandSetExecutionOptions(command: CommandSetExecutionOptions): Promise<void> {
    // The executionOptions property is readonly so other objects may create a reference to it. In order to update it,
    // we can't create a new object, and instead must do a property-by-property copy of the values.
    EngineObject.cloneProperties(this.executionOptions, command.executionOptions);
  }
}
