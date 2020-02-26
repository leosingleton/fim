// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimEngineOptions, defaultEngineOptions } from '../api/FimEngineOptions';
import { FimImageOptions, defaultImageOptions } from '../api/FimImageOptions';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';
import { deepCopy } from '@leosingleton/commonlibs';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvas {
  /**
   * Derived classes must override this constructor to instantiate the canvasElement object
   * @param dimensions Canvas dimensions
   * @param handle Handle of the image that owns this canvas. Used only for debugging.
   * @param engineOptions Options for the FIM execution engine
   * @param imageOptions Image options
   */
  protected constructor(dimensions: FimDimensions, handle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    this.canvasDimensions = dimensions.toFloor();
    this.imageHandle = handle;
    this.engineOptions = engineOptions ?? deepCopy(defaultEngineOptions);
    this.imageOptions = imageOptions ?? deepCopy(defaultImageOptions);
  }

  /** Canvas dimensions */
  public readonly canvasDimensions: FimDimensions;

  /** Handle of the image that owns this canvas. Used only for debugging. */
  public readonly imageHandle: string;

  /** Options for the FIM execution engine */
  public readonly engineOptions: FimEngineOptions;

  /** Image options */
  public readonly imageOptions: FimImageOptions;

  /** Disposed the WebGL canvas and all related objects, such as shaders and textures */
  public dispose(): void {
    this.disposeSelf();
    this.isDisposed = true;
  }

  /** Set by the dispose() method */
  protected isDisposed = false;

  /** Throws an exception if the object is disposed */
  protected ensureNotDisposed(): void {
    if (this.isDisposed) {
      throw new FimError(FimErrorCode.ObjectDisposed, `${this.imageHandle} is disposed`);
    }
  }

  /** Derived classes must override this method to dispose the canvas */
  protected abstract disposeSelf(): void;

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