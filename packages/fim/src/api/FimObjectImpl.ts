// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
import { FimObject } from './FimObject';
import { FimReleaseResourcesFlags } from './FimReleaseResourcesFlags';
import { FimError, FimErrorCode } from '../primitives/FimError';

/** Base class for FIM objects. Implements the parent-child tree structure defined in the `FimObject` interface. */
export abstract class FimObjectImpl implements FimObject {
  /**
   * Constructor
   * @param type Unique string describing the type of the object
   * @param name An optional name specified when creating the object to help with debugging
   * @param parent Parent object. May be `undefined` if this object is the root.
   */
  protected constructor(type: string, name?: string, parent?: FimObject) {
    this.objectType = type;

    // Build the object handle
    let handle = `${type}.${FimObjectImpl.globalHandleCount++}`;
    if (name) {
      handle += `.${name}`;
    }
    if (parent) {
      handle = `${parent.handle}/${handle}`;
    }
    this.handle = handle;

    this.rootObject = parent ? parent.rootObject : this as any as Fim;
    this.reparent(parent);
  }

  /** Global counter used to assign a unique handle to objects in FIM */
  private static globalHandleCount = 0;

  public reparent(parent?: FimObject): void {
    const me = this;
    me.ensureNotDisposed();

    if (parent) {
      // When adopting children, the old and new parent must share the same root object.
      if (parent && parent.rootObject !== me.rootObject) {
        throw new FimError(FimErrorCode.ReparentFailed,
          `${me.parentObject.handle} (${me.rootObject.handle}) => ${parent.handle} (${parent.rootObject.handle})`);
      }

      // Add the relationship to the new parent object
      parent.addChild(me);
    }

    // Remove the relationship to the old parent object
    if (me.parentObject) {
      me.parentObject.removeChild(me);
      me.parentObject = undefined;
    }

    me.parentObject = parent;
  }

  public addChild(child: FimObject): void {
    this.ensureNotDisposed();
    this.childObjects.push(child);
  }

  public removeChild(child: FimObject): void {
    this.ensureNotDisposed();
    this.childObjects = this.childObjects.filter(c => c !== child);
  }

  public readonly objectType: string;
  public readonly handle: string;
  public childObjects: FimObject[] = [];
  public parentObject: FimObject;
  public rootObject: Fim;

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
    const me = this;
    me.ensureNotDisposed();

    // Recursively dispose child objects first
    while (me.childObjects.length > 0) {
      const child = me.childObjects.pop();
      child.dispose();
    }

    // Release our own resources
    me.releaseOwnResources(FimReleaseResourcesFlags.All);

    // Remove our parent's reference to ourselves
    if (me.parentObject) {
      me.parentObject.removeChild(me);
      me.parentObject = undefined;
    }

    // Remove our reference to the root object
    me.rootObject = undefined;

    // Ensure no further methods are called on this object
    me.isDisposed = true;
  }

  /** Set by the dispose() method */
  protected isDisposed = false;

  /** Throws an exception if the object is disposed */
  protected ensureNotDisposed(): void {
    if (this.isDisposed) {
      FimError.throwOnObjectDisposed(this.handle);
    }
  }
}
