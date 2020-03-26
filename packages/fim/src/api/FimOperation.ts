// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
import { FimImage } from './FimImage';
import { FimObject } from './FimObject';
import { FimReleaseResourcesFlags } from './FimReleaseResourcesFlags';
import { FimError } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';

/**
 * Base class for FIM operation classes. In FIM, operations wrap one or more shaders into a more high-level operation,
 * managing the setting of constants, uniforms, and vertices, and also invoking shaders in the correct order while
 * managing any temporary images.
 */
export abstract class FimOperation implements FimObject {
  /**
   * Constructor
   * @param fim FIM instance
   * @param objectName Optional object name to help for debugging
   */
  protected constructor(fim: Fim, objectName?: string) {
    // Build the handle for the operation
    let handle = `${fim.handle}/Wrapper.${FimOperation.operationHandleCount++}`;
    if (objectName) {
      handle += `.${objectName}`;
    }
    this.handle = handle;

    // Initialize member variables
    this.parentObject = fim;

    // Register ourselves with the parent to receive releaseResources() and dispose() calls
    fim.registerChildObject(this);
  }

  /** Global counter used to assign a unique handle to operations in FIM */
  private static operationHandleCount = 0;

  public readonly handle: string;
  public childObjects: FimObject[] = [];
  public parentObject: Fim;

  /**
   * Called by a derived class whenever it creates a shader, image, or other operation
   * @param child Child object
   */
  protected registerChildObject(child: FimObject): void {
    this.childObjects.push(child);
  }

  /**
   * Called by a derived class whenever it disposes a shader, image, or other operation
   * @param child Child object
   */
  protected unregisterChildObject(child: FimObject): void {
    this.childObjects = this.childObjects.filter(c => c !== child);
  }

  public releaseResources(flags: FimReleaseResourcesFlags): void {
    // Deliver this notification to all child opens. Note that this may result in duplicate calls. as it also received
    // notifications from the parent FIM instance if it was sent there and not directly to this operation object first.
    // However, releaseResources() is idempotent so multiple calls have no impact.
    for (const child of this.childObjects) {
      child.releaseResources(flags);
    }
  }

  public releaseAllResources(): void {
    this.releaseResources(FimReleaseResourcesFlags.All);
  }

  /** Set to `true` on the first call to `dispose()` */
  private isDisposed = false;

  public dispose() {
    const me = this;

    if (me.isDisposed) {
      FimError.throwOnObjectDisposed(me.handle);
    } else {
      // Call dispose on all children. Note that dispose() may have been triggered from the parent FIM instance, in
      // which case we have to be careful not to call child.dispose() twice--once from the parent FIM instance and once
      // here. Hence, we check to see whether the child is still referenced by the FIM instance and only call it if so.
      // If it is not referenced, that means it was disposed prior to this operation.
      for (const child of me.childObjects) {
        if (FimOperation.isReferencedBy(me.parentObject, child, me)) {
          child.dispose();
        }
      }

      // Prevent future dispose() calls
      me.isDisposed = true;

      // Stop receiving notifications from the parent
      me.parentObject.unregisterChildObject(me);
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
      if (c === child || FimOperation.isReferencedBy(c, child)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Derived classes must implement this method to execute the operation.
   * @param outputImage Destination image to render to
   * @param destCoords If set, renders the output to the specified destination coordinates using WebGL's viewport and
   *    scissor operations. By default, the destination is the full texture or canvas. Note that the coordinates use
   *    the top-left as the origin, to be consistent with 2D canvases, despite WebGL typically using bottom-left.
   */
  public abstract executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void>;
}
