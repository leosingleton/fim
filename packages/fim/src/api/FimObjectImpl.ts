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
      // Replace all . and / with underscores
      handle += `.${name.replace(/[./]/g, '_')}`;
    }
    if (parent) {
      handle = `${parent.objectHandle}/${handle}`;
    }
    this.objectHandle = handle;

    // Establish parent/child/root mappings
    this.rootObject = parent ? parent.rootObject : this as any as Fim;
    this.parentObject = parent;
    if (parent) {
      if (parent instanceof FimObjectImpl) {
        parent.addChild(this);
      } else {
        // All FimObject implementations are currently derived from FimObjectImpl. If this does not hold true in the
        // future, we'll need to redesign parent/child mappings.
        FimError.throwOnUnreachableCode();
      }
    }
  }

  /** Global counter used to assign a unique handle to objects in FIM */
  private static globalHandleCount = 0;

  /**
   * Registers a child object, which causes this object to forward any `releaseResources()`, `releaseAllResources()`,
   * and `dispose()` calls.
   * @param child Child object to receive notifications
   */
  private addChild(child: FimObject): void {
    this.ensureNotDisposed();
    this.childObjects.push(child);
  }

  /**
   * Stops sending calls to a child object previously registered with `addChild()`. Child objects call this
   * object on disposal in case they are disposed prior to the disposal of their parent object.
   * @param child Child object to stop receiving notifications
   */
  private removeChild(child: FimObject): void {
    this.ensureNotDisposed();
    this.childObjects = this.childObjects.filter(c => c !== child);
  }

  public readonly objectType: string;
  public readonly objectHandle: string;
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
      if (me.parentObject instanceof FimObjectImpl) {
        me.parentObject.removeChild(me);
      } else {
        // All FimObject implementations are currently derived from FimObjectImpl. If this does not hold true in the
        // future, we'll need to redesign parent/child mappings.
        FimError.throwOnUnreachableCode();
      }
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
      FimError.throwOnObjectDisposed(this.objectHandle);
    }
  }

  /** Throws an exception if the specified object has a different root FIM instance from this object */
  protected ensureSameRoot(child: FimObject): void {
    if (this.rootObject !== child.rootObject) {
      throw new FimError(FimErrorCode.InvalidParameter,
        `${this.objectHandle} and ${child.objectHandle} have different root`);
    }
  }
}
