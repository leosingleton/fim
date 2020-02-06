// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObject } from '../../api/FimObject';
import { FimReleaseResourcesFlags } from '../../api/FimReleaseResourcesFlags';
import { FimError, FimErrorCode } from '../../primitives/FimError';
import { FeDispatcher } from '../fe/FeDispatcher';
import { FcCmd } from '../fc/FcCmd';
import { FcDispose } from '../fc/FcDispose';
import { FcReleaseResources } from '../fc/FcReleaseResources';

/** Base class for all objects in the FIM API */
export abstract class FaFimObject implements FimObject {
  /**
   * Base constructor for all objects in the FIM API
   * @param dispatcher Back-end FIM engine
   * @param objectType A short string indicating the object type, e.g. 'img' for FimImage
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  protected constructor(dispatcher: FeDispatcher, objectType: string, objectName?: string) {
    // Create a globally-unique handle name. Although really, only the global handle count is needed, we add the object
    // type and name to make it easier to debug.
    this.handle = `${objectType}.${FaFimObject.globalHandleCount++}`;
    if (objectName) {
      this.handle += `.${objectName}`;
    }

    this.dispatcher = dispatcher;
  }

  public readonly handle: string;

  /** Global counter used to assign a unique handle to objects in FIM */
  private static globalHandleCount = 0;

  /** Back-end FIM engine */
  private dispatcher: FeDispatcher;

  public releaseResources(flags: FimReleaseResourcesFlags): void {
    const cmd: FcReleaseResources = {
      cmd: 'rr',
      flags
    };
    this.dispatchCommand(cmd);
  }

  public releaseAllResources(): void {
    this.releaseResources(FimReleaseResourcesFlags.All);
  }

  public dispose(): void {
    const cmd: FcDispose = {
      cmd: 'd'
    };
    this.dispatchCommand(cmd);

    delete this.dispatcher;
  }

  protected dispatchCommand(cmd: FcCmd): void {
    const dispatcher = this.dispatcher;
    const handle = this.handle;

    if (!dispatcher) {
      throw new FimError(FimErrorCode.AppError, `${handle} is disposed`);
    }

    dispatcher.dispatchCommand(handle, cmd);
  }
}
