// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { HandleBuilder } from '../../dispatcher/HandleBuilder';
import { FimReleaseResourcesFlags } from '../../../api/FimReleaseResourcesFlags';
import { FimError, FimErrorCode } from '../../../primitives/FimError';

/**
 * Base class for all backend rendering engine objects. Primarily provides functionality around parent-child
 * relationships and resource management.
 */
export abstract class CoreObject {
  /**
   * Constructor
   * @param shortHandle Unique handle for this object
   * @param parent Parent object. May be undefined if this object is the root.
   */
  public constructor(shortHandle: string, parent?: CoreObject) {
    this.shortHandle = shortHandle;
    this.handle = parent ? HandleBuilder.createObjectHandle(parent.handle, shortHandle) : shortHandle;
    this.parentObject = parent;

    // If we are not root, add a reference to ourselves from our parent object
    if (parent) {
      parent.addChild(this);
    }
  }

  /** Unique value identifying this object */
  public readonly shortHandle: string;

  /** Handle including the full path from parent to child objects */
  public readonly handle: string;

  /**
   * Called by a child object from its constructor to register its handle with its parent
   * @param child Child object
   */
  protected addChild(child: CoreObject): void {
    this.childObjects[child.shortHandle] = child;
  }

  /**
   * Called by a child object from its dispose() method to deregister its handle with its parent
   * @param child Child object
   */
  protected removeChild(child: CoreObject): void {
    delete this.childObjects[child.shortHandle];
  }

  /**
   * Returns a child object by its long handle
   * @param handle Long handle of child object
   */
  public getChildByHandle(handle: string): CoreObject {
    // Extract the next child in the long handle
    const nextHandle = HandleBuilder.parseAfter(handle, this.shortHandle);
    if (!nextHandle) {
      return this;
    }
    const nextObject = this.childObjects[nextHandle];
    if (!nextObject) {
      throw new FimError(FimErrorCode.AppError, `Invalid handle ${handle}`);
    }

    // Recurse until we find the leaf node
    return nextObject.getChildByHandle(handle);
  }

  /**
   * Hash table of short handles to child objects. To recursively search this hash table using a long handle, see
   * getChildByHandle().
   */
  private childObjects: { [shortHandle: string]: CoreObject } = {};

  /** Parent object. Undefined for the root object. */
  public parentObject: CoreObject;

  /**
   * Releases memory and/or GPU resources
   * @param flags Specifies which resources to release
   */
  public releaseResources(flags: FimReleaseResourcesFlags): void {
    // Recursively release resources of child objects first
    for (const childHandle in this.childObjects) {
      this.childObjects[childHandle].releaseResources(flags);
    }

    // Release this object's resources
    this.releaseOwnResources(flags);
  }

  /**
   * Derived classes must implement this method to release their own resources
   * @param flags Specifies which resources to release
   */
  protected abstract releaseOwnResources(flags: FimReleaseResourcesFlags): void;

  /** Completely disposes all memory and GPU resources */
  public dispose(): void {
    // Recursively dispose child objects first
    for (const childShortHandle in this.childObjects) {
      this.childObjects[childShortHandle].dispose();
    }

    // Release our own resources
    this.releaseOwnResources(FimReleaseResourcesFlags.All);

    // Remove our parent's reference to ourselves
    if (this.parentObject) {
      this.parentObject.removeChild(this);
    }

    // Make this object unusable
    this.childObjects = {};
    delete this.parentObject;
    this.isDisposed = true;
  }

  /** Set by the dispose() method */
  protected isDisposed = false;
}
