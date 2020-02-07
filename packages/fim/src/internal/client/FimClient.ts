// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImageClient } from './FimImageClient';
import { FimObjectClient } from './FimObjectClient';
import { Fim } from '../../api/Fim';
import { FimExecutionOptions, defaultExecutionOptions } from '../../api/FimExecutionOptions';
import { FimImageOptions, defaultImageOptions } from '../../api/FimImageOptions';
import { FimDimensions } from '../../primitives/FimDimensions';
import { CommandBeginExecution } from '../commands/CommandBeginExecution';
import { CommandSetExecutionOptions } from '../commands/CommandSetExecutionOptions';
import { Dispatcher } from '../dispatcher/Dispatcher';
import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { deepCopy, deepEquals } from '@leosingleton/commonlibs';

/** Client implementation of the Fim interface */
export abstract class FimClient extends FimObjectClient implements Fim {
  /**
   * Constructor
   * @param dispatcher Back-end FIM engine
   * @param maxImageDimensions Maximum dimensions of any image
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  public constructor(dispatcher: Dispatcher, maxImageDimensions: FimDimensions, objectName?: string) {
    super(dispatcher, 'fim', objectName);
    this.maxImageDimensions = maxImageDimensions;

    // Initialize options to library defaults. The properties are public, so API clients may change them after FIM
    // creation.
    this.executionOptions = defaultExecutionOptions;
    this.defaultImageOptions = defaultImageOptions;
  }

  public readonly maxImageDimensions: FimDimensions;
  public executionOptions: FimExecutionOptions;
  public defaultImageOptions: FimImageOptions;

  public abstract createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string):
    FimImageClient;

  public beginExecution(): void {
    const command: CommandBeginExecution = {
      command: 'BeginExecution',
      optimizationHints: {
        canQueue: false
      }
    };
    this.dispatchCommand(command);
  }

  protected dispatchCommand(command: DispatcherCommandBase): void {
    // Check whether the executionOptions have changed. If so, update the backend rendering engine.
    const cur = this.executionOptions;
    const prev = this.lastExecutionOptions;
    if (!prev || !deepEquals(cur, prev)) {
      const seoCommand: CommandSetExecutionOptions = {
        command: 'SetExecutionOptions',
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
}
