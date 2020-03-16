// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineObjectType } from './EngineObjectType';
import { FimObject } from '../api/FimObject';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimError } from '../primitives/FimError';

/** Base class for all objects in the FIM API */
export abstract class EngineObject implements FimObject {
  /**
   * Constructor
   * @param objectType Type of the object
   * @param objectName An optional name specified when creating the object to help with debugging
   * @param parent Parent object. May be undefined if this object is the root.
   */
  public constructor(objectType: EngineObjectType, objectName?: string, parent?: EngineObject) {
    this.objectType = objectType;

    // Build the object handle
    let handle = `${objectType}.${EngineObject.globalHandleCount++}`;
    if (objectName) {
      handle += `.${objectName}`;
    }
    if (parent) {
      handle = `${parent.handle}/${handle}`;
    }
    this.handle = handle;

    this.parentObject = parent;

    // If we are not root, add a reference to ourselves from our parent object
    if (parent) {
      parent.addChild(this);
    }
  }

  /** Type of the object */
  public readonly objectType: EngineObjectType;

  /** Handle including the full path from parent to child objects */
  public readonly handle: string;

  /** Global counter used to assign a unique handle to objects in FIM */
  private static globalHandleCount = 0;

  /**
   * Called by a child object from its constructor to register its handle with its parent
   * @param child Child object
   */
  protected addChild(child: FimObject): void {
    this.childObjects.push(child);
  }

  /**
   * Called by a child object from its dispose() method to deregister its handle with its parent
   * @param child Child object
   */
  protected removeChild(child: FimObject): void {
    this.childObjects = this.childObjects.filter(c => c !== child);
  }

  public childObjects: FimObject[] = [];
  public parentObject: EngineObject;

  public releaseResources(flags: FimReleaseResourcesFlags): void {
    // Recursively release resources of child objects first
    for (const child of this.childObjects) {
      child.releaseResources(flags);
    }

    // Release this object's resources
    this.releaseOwnResources(flags);
  }

  public releaseAllResources(): void {
    this.releaseResources(FimReleaseResourcesFlags.All);
  }

  /**
   * Derived classes must implement this method to release their own resources
   * @param flags Specifies which resources to release
   */
  protected abstract releaseOwnResources(flags: FimReleaseResourcesFlags): void;

  public dispose(): void {
    this.ensureNotDisposed();

    // Recursively dispose child objects first
    for (const child of this.childObjects) {
      child.dispose();
    }

    // Release our own resources
    this.releaseOwnResources(FimReleaseResourcesFlags.All);

    // Remove our parent's reference to ourselves
    if (this.parentObject) {
      this.parentObject.removeChild(this);
      this.parentObject = undefined;
    }

    // Ensure no further methods are called on this object
    this.isDisposed = true;
  }

  /** Set by the dispose() method */
  protected isDisposed = false;

  /** Throws an exception if the object is disposed */
  protected ensureNotDisposed(): void {
    if (this.isDisposed) {
      FimError.throwOnObjectDisposed(this.handle);
    }
  }

  /** Throws an exception if the object is disposed or does not have a WebGL context */
  protected ensureNotDisposedAndHasContext(): void {
    // Check not only ourselves but also parent objects, recursively
    this.ensureNotDisposed();
    if (this.parentObject) {
      this.parentObject.ensureNotDisposedAndHasContext();
    }
  }
}
