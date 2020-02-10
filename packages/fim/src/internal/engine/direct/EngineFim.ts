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
   * @param handle Short handle of the new FIM object
   * @param engine Parent Engine instance
   */
  public constructor(handle: string, engine: Engine<EngineFim<TEngineImage>, TEngineImage>) {
    super(handle, engine);
  }

  public executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      case DispatcherOpcodes.CreateImage:
        return this.createImage(command as any as CommandCreateImage);

      default:
        this.throwInvalidOperation(command);
    }
  }

  private createImage(command: CommandCreateImage): void {
    const image = this.createEngineImage(command.imageHandle, command.imageDimensions);
    this.addChild(image);
  }

  /** Derived classes must implement this method to call the TEngineImage constructor */
  protected abstract createEngineImage(handle: string, imageDimensions: FimDimensions): TEngineImage;
}
