// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas2D } from './CoreCanvas2D';
import { CoreCanvasOptions } from  './CoreCanvasOptions';
import { FimEngineOptions, defaultEngineOptions } from '../api/FimEngineOptions';
import { FimColor } from '../primitives/FimColor';
import { FimDimensional } from '../primitives/FimDimensional';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';
import { deepCopy } from '@leosingleton/commonlibs';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvas implements FimDimensional {
  /**
   * Derived classes must override this constructor to instantiate the canvasElement object
   * @param canvasOptions Canvas options
   * @param dimensions Canvas dimensions
   * @param handle Handle of the image that owns this canvas. Used only for debugging.
   * @param engineOptions Options for the FIM execution engine
   */
  protected constructor(canvasOptions: CoreCanvasOptions, dimensions: FimDimensions, handle: string,
      engineOptions?: FimEngineOptions) {
    this.dim = dimensions.toFloor();
    this.handle = handle;
    this.canvasOptions = deepCopy(canvasOptions);
    this.engineOptions = engineOptions ?? deepCopy(defaultEngineOptions);
    this.hasImage = false;
  }

  /** Canvas dimensions */
  public readonly dim: FimDimensions;

  /** Handle of the image that owns this canvas. Used only for debugging. */
  public readonly handle: string;

  /** Canvas options */
  public readonly canvasOptions: CoreCanvasOptions;

  /** Options for the FIM execution engine */
  public readonly engineOptions: FimEngineOptions;

  /** Dispose the WebGL canvas and all related objects, such as shaders and textures */
  public dispose(): void {
    const me = this;
    me.ensureNotDisposed();
    me.disposeSelf();
    me.isDisposed = true;
  }

  /** Set by the dispose() method */
  protected isDisposed = false;

  /** Throws an exception if the object is disposed */
  public ensureNotDisposed(): void {
    if (this.isDisposed) {
      FimError.throwOnObjectDisposed(this.handle);
    }
  }

  /** Derived classes must override this method to dispose the canvas */
  protected abstract disposeSelf(): void;

  /** Derived classes must override this method to return a CanvasImageSource */
  public abstract getImageSource(): CanvasImageSource;

  /** Boolean indicating whether this canvas has an image. Set to true by any of the calls which set its content. */
  public hasImage: boolean;

  /** Throws an exception if the canvas is disposed or does not have an image */
  public ensureNotDisposedAndHasImage(): void {
    this.ensureNotDisposed();
    if (!this.hasImage) {
      throw new FimError(FimErrorCode.ImageUninitialized, this.handle);
    }
  }

  /**
   * Creates a temporary canvas using `CoreCanvas2D`
   * @param dimensions Optional canvas dimensions. If unspecified, defaults to the same dimensions as this canvas.
   * @param canvasOptions Optional canvas options. If unspecified, inherits the image options from this canvas.
   * @returns `CoreCanvas2D` instance of the same type as this canvas. The caller is reponsible for calling `dispose()`
   *    on the returned object.
   */
  public createTemporaryCanvas2D(canvasOptions?: CoreCanvasOptions, dimensions?: FimDimensions): CoreCanvas2D {
    return this.createCanvas2D(canvasOptions ?? this.canvasOptions, dimensions ?? this.dim, `${this.handle}/Temp`,
      this.engineOptions);
  }

  /** Derived classes must implement this method to call the CoreCanvas2D constructor */
  protected abstract createCanvas2D(canvasOptions: CoreCanvasOptions, dimensions: FimDimensions, handle: string,
    engineOptions: FimEngineOptions): CoreCanvas2D;

  /**
   * Helper function to fill a canvas with a solid color
   * @param color Fill color
   */
  public abstract fillSolid(color: FimColor | string): void;

  /**
   * Gets the pixel color at the specified coordinate
   * @param point X and Y coordinates, in pixels
   * @returns Pixel color
   */
  public abstract getPixel(point: FimPoint): FimColor;

  /**
   * Exports the canvas contents to an array of RGBA pixels
   * @param srcCoords Source coordinate to export, in pixels. If unspecified, the full canvas is exported.
   * @returns An array containing 4 bytes per pixel, in RGBA order
   */
  public abstract exportToPixelData(srcCoords?: FimRect): Uint8ClampedArray;
}
