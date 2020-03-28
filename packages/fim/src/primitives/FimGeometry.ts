// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensional } from './FimDimensional';
import { FimDimensions } from './FimDimensions';
import { FimError, FimErrorCode } from './FimError';
import { FimPoint } from './FimPoint';
import { FimRect } from './FimRect';

/** Base class for any immutable FIM primitives that wrap geometric objects like points, rectangles, etc. */
export abstract class FimGeometry {
  /** Compares the value of two FIM geometery objects */
  public abstract equals(object: FimGeometry): boolean;

  /** Returns whether this object contains the supplied dimensions */
  public abstract containsDimensions(dimensions: FimDimensions): boolean;

  /** Returns whether this object contains the supplied point */
  public abstract containsPoint(point: FimPoint): boolean;

  /** Returns whether this object contains the supplied rectangle */
  public abstract containsRect(rect: FimRect): boolean;

  /** Returns whether this object is contained within another */
  public abstract containedBy(object: FimGeometry): boolean;

  /**
   * Throws an invalid parameter exception if this object is not contained within the dimensions of the `object`
   * parameter
   */
  public validateIn(object: FimDimensional): void {
    this.validateInDimensions(object.dim);
  }

  /**
   * Throws an invalid parameter exception if this object is not contained within the `dimensions` parameter
   */
  public validateInDimensions(dimensions: FimDimensions): void {
    if (!this.containedBy(dimensions)) {
      throw new FimError(FimErrorCode.InvalidParameter, `${this} !in ${dimensions}`);
    }
  }

  /** Returns a new object where all coordinates are a round integer, calculated with the `Math.floor()` function */
  public abstract toFloor(): FimGeometry;

  /** Returns a new object where all coordinates are scaled by a multiplier */
  public abstract rescale(ratio: number): FimGeometry;

  /** FIM geometry objects must implement a custom `toString()` method which describes the coordinates of the shape */
  public abstract toString(): string;
}
