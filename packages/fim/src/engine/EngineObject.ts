// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineObjectType } from './EngineObjectType';
import { FimObject } from '../api/FimObject';
import { FimObjectImpl } from '../api/FimObjectImpl';

/** Base class for all objects in the FIM API */
export abstract class EngineObject extends FimObjectImpl {
  /**
   * Constructor
   * @param type Type of the object
   * @param name An optional name specified when creating the object to help with debugging
   * @param parent Parent object. May be undefined if this object is the root.
   */
  public constructor(type: EngineObjectType, name?: string, parent?: FimObject) {
    super(type, name, parent);
  }

  // Specify more specific types for FimObject properties
  public readonly objectType: EngineObjectType;
  public childObjects: EngineObject[];
  public parentObject: EngineObject;
  public rootObject: EngineFim;

  /** Throws an exception if the object is disposed or does not have a WebGL context */
  protected ensureNotDisposedAndHasContext(): void {
    this.ensureNotDisposed();

    // Check not only ourselves but also parent objects, recursively. Note that some objects in the tree may not be
    // EngineObjects and not have this method.
    let current = this.parentObject;
    while (current) {
      if (current instanceof EngineObject) {
        current.ensureNotDisposedAndHasContext();
      }
      current = current.parentObject;
    }
  }
}
