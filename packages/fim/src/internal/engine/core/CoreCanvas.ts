// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from '../../../primitives/FimDimensions';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvas {
  /**
   * Derived classes must override this constructor to instantiate the canvasElement object
   * @param canvasDimensions Canvas dimensions
   * @param imageHandle Handle of the image that owns this canvas. Used only for debugging.
   */
  protected constructor(canvasDimensions: FimDimensions, imageHandle: string) {
    this.canvasDimensions = canvasDimensions;
    this.imageHandle = imageHandle;
  }

  /** Canvas dimensions */
  public readonly canvasDimensions: FimDimensions;

  /** Handle of the image that owns this canvas. Used only for debugging. */
  public readonly imageHandle: string;

  /** Derived classes must override this method to dispose the canvas */
  public abstract dispose(): void;
}
