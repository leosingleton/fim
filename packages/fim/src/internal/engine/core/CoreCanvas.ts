// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor } from '../../../primitives/FimColor';
import { FimDimensions } from '../../../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../../../primitives/FimError';
import { FimPoint } from '../../../primitives/FimPoint';
import { FimRect } from '../../../primitives/FimRect';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvas {
  /**
   * Derived classes must override this constructor to instantiate the canvasElement object
   * @param canvasDimensions Canvas dimensions
   * @param imageHandle Handle of the image that owns this canvas. Used only for debugging.
   */
  protected constructor(canvasDimensions: FimDimensions, imageHandle: string) {
    this.canvasDimensions = canvasDimensions.toFloor();
    this.imageHandle = imageHandle;
  }

  /** Canvas dimensions */
  public readonly canvasDimensions: FimDimensions;

  /** Handle of the image that owns this canvas. Used only for debugging. */
  public readonly imageHandle: string;

  /** Derived classes must override this method to dispose the canvas */
  public abstract dispose(): void;

  /** Derived classes must override this method to return a CanvasImageSource */
  public abstract getImageSource(): CanvasImageSource;

  /**
   * Helper function to fill a canvas with a solid color
   * @param color Fill color
   */
  public abstract fillCanvas(color: FimColor | string): void;

  /**
   * Gets the pixel color at the specified coordinate
   * @param x X-coordinate, in pixels
   * @param y Y-coordinate, in pixels
   * @returns Pixel color
   */
  public abstract getPixel(x: number, y: number): FimColor;

  /** Throws an exception if the coordinates are outside of the canvas */
  public validateCoordinates(point: FimPoint): void {
    const rect = FimRect.fromDimensions(this.canvasDimensions);
    if (!rect.containsPoint(point)) {
      throw new FimError(FimErrorCode.InvalidParameter, `${point} invalid`);
    }
  }

  /** Throws an exception if the rectangle extends outside of the canvas */
  public validateRect(rect: FimRect): void {
    const outer = FimRect.fromDimensions(this.canvasDimensions);
    if (!outer.containsRect(rect)) {
      throw new FimError(FimErrorCode.InvalidParameter, `${rect} invalid`);
    }
  }
}
