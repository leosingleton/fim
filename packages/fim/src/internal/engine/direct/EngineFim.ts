// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Engine } from './Engine';
import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { FimDimensions } from '../../../primitives/FimDimensions';
import { CommandCreateImage } from '../../commands/CommandCreateImage';
import { DispatcherOpcodes } from '../../commands/DispatcherOpcodes';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';

/** Backend instance of the FIM engine */
export abstract class EngineFim<TEngineImage extends EngineImage> extends EngineObject {
  /**
   * Constructor
   * @param shortHandle Short handle of the new FIM object
   * @param engine Parent Engine instance
   */
  public constructor(shortHandle: string, engine: Engine<EngineFim<TEngineImage>, TEngineImage>) {
    super(shortHandle, engine);
  }

  public executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      case DispatcherOpcodes.CreateImage:
        return this.commandCreateImage(command as any as CommandCreateImage);

      default:
        return super.executeCommand(command);
    }
  }

  private commandCreateImage(command: CommandCreateImage): void {
    const image = this.createEngineImage(command.imageShortHandle, command.imageDimensions);
    this.addChild(image);
  }

  /** Derived classes must implement this method to call the TEngineImage constructor */
  protected abstract createEngineImage(shortHandle: string, imageDimensions: FimDimensions): TEngineImage;
}
