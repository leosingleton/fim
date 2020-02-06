// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObject } from '../../api/FimObject';
import { FimError, FimErrorCode } from '../../primitives/FimError';

/** Base class for all objects in the FIM API */
export abstract class FaFimObject implements FimObject {
  /**
   * Base constructor for all objects in the FIM API
   * @param objectType A short string indicating the object type, e.g. 'img' for FimImage
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  protected constructor(objectType: string, objectName?: string) {
    // Create a globally-unique handle name. Although really, only the global handle count is needed, we add the object
    // type and name to make it easier to debug.
    this.handle = `${objectType}.${FaFimObject.globalHandleCount++}`;
    if (objectName) {
      this.handle += `.${objectName}`;
    }
  }

  public readonly handle: string;

  /** Global counter used to assign a unique handle to objects in FIM */
  private static globalHandleCount = 0;

  public abstract releaseResources(): void;

  public dispose(): void {
    this.releaseResources();
    this.isDisposed = true;
  }

  /** Set to true once the object's dispose() method has been called */
  protected isDisposed = false;

  /**
   * Helper function called at the beginning of every API entry points to throw an exeception if the object has already
   * been disposed.
   */
  protected ensureNotDisposed(): void {
    if (this.isDisposed) {
      throw new FimError(FimErrorCode.AppError, `${this.handle} is disposed`);
    }
  }
}
