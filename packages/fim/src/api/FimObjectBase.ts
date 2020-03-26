// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObject } from '../api/FimObject';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimError } from '../primitives/FimError';

/** Base class for FIM objects. Implements the parent-child tree structure defined in the `FimObject` interface. */
export abstract class FimObjectBase implements FimObject {
  /**
   * Constructor
   * @param objectType Unique string describing the type of the object
   * @param objectName An optional name specified when creating the object to help with debugging
   * @param parent Parent object. May be `undefined` if this object is the root.
   */
  protected constructor(objectType: string, objectName?: string, parent?: FimObject) {
    this.objectType = objectType;

    // Build the object handle
    let handle = `${objectType}.${FimObjectBase.globalHandleCount++}`;
    if (objectName) {
      handle += `.${objectName}`;
    }
    if (parent) {
      handle = `${parent.handle}/${handle}`;
    }
    this.handle = handle;

    this.parentObject = parent;
    this.rootObject = parent ? parent.rootObject : this;

    // If we are not root, add a reference to ourselves from our parent object
    if (parent) {
      parent.addChild(this);
    }
  }

  /** Global counter used to assign a unique handle to objects in FIM */
  private static globalHandleCount = 0;

  public addChild(child: FimObject): void {
    this.childObjects.push(child);
  }

  public removeChild(child: FimObject): void {
    this.childObjects = this.childObjects.filter(c => c !== child);
  }

  public readonly objectType: string;
  public readonly handle: string;
  public childObjects: FimObject[] = [];
  public parentObject: FimObject;
  public rootObject: FimObject;

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

    // Recursively dispose child objects first. Note that dispose() may have been triggered from the parent FIM
    // instance, in which case we have to be careful not to call child.dispose() twice--once from the parent FIM
    // instance and once here. Hence, we check to see whether the child is still referenced by the root FIM instance
    // and only call it if so. If it is not referenced, that means it was disposed prior to this operation.
    for (const child of me.childObjects) {
      if (FimObjectBase.isReferencedBy(me.rootObject, child, me)) {
        child.dispose();
      }
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

  /**
   * Searches the parent-child relationships recursively to determine whether the `child` object has a reference from
   * `parent`. Used in `dispose()` to prevent double-dispose.
   * @param parent Parent FIM object to search child relationships of
   * @param child Child FIM object to search for
   * @param ignore Optional FIM object to ignore in the recursive search
   */
  private static isReferencedBy(parent: FimObject, child: FimObject, ignore?: FimObject): boolean {
    for (const c of parent.childObjects) {
      if (c === ignore) {
        continue;
      }
      if (c === child || FimObjectBase.isReferencedBy(c, child)) {
        return true;
      }
    }

    return false;
  }
}
