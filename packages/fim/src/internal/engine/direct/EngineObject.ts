// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimReleaseResourcesFlags } from '../../../api/FimReleaseResourcesFlags';
import { FimError, FimErrorCode } from '../../../primitives/FimError';
import { CommandDispose } from '../../commands/CommandDispose';
import { CommandReleaseResources } from '../../commands/CommandReleaseResources';
import { DispatcherOpcodes } from '../../commands/DispatcherOpcodes';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { HandleBuilder } from '../../dispatcher/HandleBuilder';

/** Low-level FIM rendering engine */
export abstract class EngineObject {
  /**
   * Constructor
   * @param shortHandle Unique handle for this object
   * @param parent Parent object. May be undefined if this object is the root.
   */
  public constructor(shortHandle: string, parent?: EngineObject) {
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
  protected addChild(child: EngineObject): void {
    this.childObjects[child.shortHandle] = child;
  }

  /**
   * Called by a child object from its dispose() method to deregister its handle with its parent
   * @param child Child object
   */
  protected removeChild(child: EngineObject): void {
    delete this.childObjects[child.shortHandle];
  }

  /**
   * Returns a child object by its long handle
   * @param handle Long handle of child object
   */
  public getChildByHandle<TObject extends EngineObject>(handle: string): TObject {
    // Extract the next child in the long handle
    const nextHandle = HandleBuilder.parseAfter(handle, this.shortHandle);
    if (!nextHandle) {
      return this as any as TObject;
    }
    const nextObject = this.childObjects[nextHandle];
    if (!nextObject) {
      throw new FimError(FimErrorCode.InvalidHandle, `Invalid handle ${handle}`);
    }

    // Recurse until we find the leaf node
    return nextObject.getChildByHandle<TObject>(handle);
  }

  /**
   * Hash table of short handles to child objects. To recursively search this hash table using a long handle, see
   * getChildByHandle().
   */
  private childObjects: { [shortHandle: string]: EngineObject } = {};

  /** Parent object. Undefined for the root object. */
  public parentObject: EngineObject;

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

  /** Derived classes must overload this method to handle any commands they add to the FIM engine */
  public executeCommand(command: DispatcherCommand): Promise<any> {
    switch (command.opcode) {
      case DispatcherOpcodes.Dispose:
        return this.commandDisposeCommand(command as any as CommandDispose);

      case DispatcherOpcodes.ReleaseResources:
        return this.commandReleaseResourcesCommand(command as any as CommandReleaseResources);

      default:
        throw new FimError(FimErrorCode.InvalidOpcode, `Invalid op ${command.opcode}`);
    }
  }

  private async commandDisposeCommand(_command: CommandDispose): Promise<void> {
    this.dispose();
  }

  private async commandReleaseResourcesCommand(command: CommandReleaseResources): Promise<void> {
    this.releaseResources(command.flags);
  }

  /**
   * Copies the properties of `src` to `dest`
   * @param dest Destination object
   * @param src Source object
   */
  protected static cloneProperties<T>(dest: T, src: T): void {
    for (const prop in src) {
      dest[prop] = src[prop];
    }
  }
}
