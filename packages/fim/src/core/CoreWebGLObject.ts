// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvasWebGL } from './CoreCanvasWebGL';

/** Wrapper around objects that are associated with a WebGL canvas */
export class CoreWebGLObject {
  /**
   * Constructor
   * @param canvas The parent WebGL canvas
   */
  public constructor(parent: CoreCanvasWebGL) {
    this.parentCanvas = parent;
  }

  /** The parent WebGL canvas */
  public readonly parentCanvas: CoreCanvasWebGL;

  /** Disposes all GPU resources */
  public dispose(): void {
    this.isDisposed = true;
  }

  /** Set by the dispose() method */
  protected isDisposed = false;
}
