// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvasWebGL } from './CoreCanvasWebGL';
import { FimError } from '../primitives/FimError';

/** Wrapper around objects that are associated with a WebGL canvas */
export abstract class CoreWebGLObject {
  /**
   * Constructor
   * @param canvas The parent WebGL canvas
   */
  public constructor(parent: CoreCanvasWebGL) {
    // Establish the parent/child relationship
    parent.childObjects.push(this);
    this.parentCanvas = parent;
  }

  /** The parent WebGL canvas */
  public parentCanvas: CoreCanvasWebGL;

  /** Disposes all GPU resources */
  public dispose(): void {
    const me = this;

    me.disposeSelf();

    // Remove the parent/child relationship
    me.parentCanvas.childObjects = me.parentCanvas.childObjects.filter(c => c !== me);
    me.parentCanvas = undefined;

    me.isDisposed = true;
  }

  /** Derived classes must implement this method to dispose their own resources */
  protected abstract disposeSelf(): void;

  /** Set by the dispose() method */
  protected isDisposed = false;

  /** Throws an exception if the object is disposed */
  protected ensureNotDisposed(): void {
    if (this.isDisposed) {
      FimError.throwOnObjectDisposed(`Child of ${this.parentCanvas.imageHandle}`);
    }
  }
}
