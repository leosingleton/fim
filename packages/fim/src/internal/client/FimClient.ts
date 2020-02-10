// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageClient } from './FimImageClient';
import { FimObjectClient } from './FimObjectClient';
import { FimObjectType } from './FimObjectType';
import { Fim } from '../../api/Fim';
import { FimExecutionOptions, defaultExecutionOptions } from '../../api/FimExecutionOptions';
import { FimImageOptions, defaultImageOptions } from '../../api/FimImageOptions';
import { FimDimensions } from '../../primitives/FimDimensions';
import { CommandBeginExecution } from '../commands/CommandBeginExecution';
import { CommandCreate } from '../commands/CommandCreate';
import { CommandCreateImage } from '../commands/CommandCreateImage';
import { CommandSetExecutionOptions } from '../commands/CommandSetExecutionOptions';
import { DispatcherOpcodes } from '../commands/DispatcherOpcodes';
import { Dispatcher } from '../dispatcher/Dispatcher';
import { DispatcherClient } from '../dispatcher/DispatcherClient';
import { DispatcherCommand } from '../dispatcher/DispatcherCommand';
import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { deepCopy, deepEquals } from '@leosingleton/commonlibs';

/** Client implementation of the Fim interface */
export abstract class FimClient<TImageClient extends FimImageClient> extends FimObjectClient
    implements Fim<TImageClient> {
  /**
   * Constructor
   * @param dispatcher Back-end FIM engine
   * @param maxImageDimensions Maximum dimensions of any image
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  public constructor(dispatcher: Dispatcher, maxImageDimensions: FimDimensions, objectName?: string) {
    // This is the root object. Create the dispatcher client, which will be shared by child objects.
    const dispatcherClient = new DispatcherClient(dispatcher);

    super(dispatcherClient, FimObjectType.Fim, objectName);
    this.maxImageDimensions = maxImageDimensions;

    // Initialize options to library defaults. The properties are public, so API clients may change them after FIM
    // creation.
    this.executionOptions = defaultExecutionOptions;
    this.defaultImageOptions = defaultImageOptions;

    // The Create command is special and is sent from the contructor itself. It simply informs the backend of the handle
    // of the new FIM instance and comes from an undefined parent object.
    const command: CommandCreate & DispatcherCommand = {
      sequenceNumber: 0,
      longHandle: undefined,
      opcode: DispatcherOpcodes.Create,
      fimHandle: this.handle,
      optimizationHints: {
        canQueue: false
      }
    };
    super.dispatchCommand(command);
  }

  public readonly maxImageDimensions: FimDimensions;
  public executionOptions: FimExecutionOptions;
  public defaultImageOptions: FimImageOptions;

  protected dispatchCommand(command: DispatcherCommandBase): void {
    // Check whether the executionOptions have changed. If so, update the backend rendering engine.
    const cur = this.executionOptions;
    const prev = this.lastExecutionOptions;
    if (!prev || !deepEquals(cur, prev)) {
      const seoCommand: CommandSetExecutionOptions = {
        opcode: DispatcherOpcodes.SetExecutionOptions,
        executionOptions: cur,
        optimizationHints: {
          canQueue: true
        }
      };
      super.dispatchCommand(seoCommand);
      this.lastExecutionOptions = deepCopy(cur);
    }

    super.dispatchCommand(command);
  }

  /** State of the executionOptions on the last call to dispatchCommand() */
  private lastExecutionOptions: FimExecutionOptions;

  public createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string): TImageClient {
    // Default values
    dimensions = dimensions ?? this.maxImageDimensions;
    options = options ?? {};

    // Dispatch the create command to the back-end
    const image = this.createImageClient(dimensions, options, imageName);
    const command: CommandCreateImage = {
      opcode: DispatcherOpcodes.CreateImage,
      imageDimensions: dimensions,
      imageHandle: image.handle,
      optimizationHints: {
        canQueue: true
      }
    };
    this.dispatchCommand(command);

    return image;
  }

  /** Derived classes must implement this method to call the TImageClient constructor */
  protected abstract createImageClient(dimensions: FimDimensions, options: FimImageOptions, imageName: string):
    TImageClient;

  public beginExecution(): void {
    const command: CommandBeginExecution = {
      opcode: DispatcherOpcodes.BeginExecution,
      optimizationHints: {
        canQueue: false
      }
    };
    this.dispatchCommand(command);
  }
}
