// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineObject } from './EngineObject';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { FimDimensions } from '../../../primitives/FimDimensions';

/** Backend instance of an image */
export abstract class EngineImage extends EngineObject {
  /**
   * Constructor
   * @param handle Short handle of the new image object
   * @param fim Parent FIM instance
   * @param imageDimensions Image dimensions
   */
  public constructor(handle: string, fim: EngineFim<EngineImage>, imageDimensions: FimDimensions) {
    super(handle, fim);
    this.imageDimensions = imageDimensions;
  }

  /** Image dimensions */
  public readonly imageDimensions: FimDimensions;

  public executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      default:
        return super.executeCommand(command);
    }
  }
}
