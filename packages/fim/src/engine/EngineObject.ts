// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineObjectType } from './EngineObjectType';
import { FimObjectBase } from '../api/FimObjectBase';

/** Base class for all objects in the FIM API */
export abstract class EngineObject extends FimObjectBase {
  /**
   * Constructor
   * @param objectType Type of the object
   * @param objectName An optional name specified when creating the object to help with debugging
   * @param parent Parent object. May be undefined if this object is the root.
   */
  public constructor(objectType: EngineObjectType, objectName?: string, parent?: EngineObject) {
    super(objectType, objectName, parent);
  }

  // Specify more specific types for FimObject properties
  public readonly objectType: EngineObjectType;
  public childObjects: EngineObject[];
  public parentObject: EngineObject;
  public rootObject: EngineFim;

  /** Throws an exception if the object is disposed or does not have a WebGL context */
  protected ensureNotDisposedAndHasContext(): void {
    // Check not only ourselves but also parent objects, recursively
    this.ensureNotDisposed();
    if (this.parentObject) {
      this.parentObject.ensureNotDisposedAndHasContext();
    }
  }
}
