// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from './FimDimensions';
import { FimError } from './FimError';
import { FimGeometry } from './FimGeometry';
import { FimRect } from './FimRect';

/** Simple class for holding a pair of coordinates */
export class FimPoint extends FimGeometry {
  public readonly x: number;
  public readonly y: number;

  private constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }

  public equals(object: FimGeometry): boolean {
    if (object instanceof FimPoint) {
      return (object.x === this.x && object.y === this.y);
    } else {
      return false;
    }
  }

  public containsDimensions(_dimensions: FimDimensions): never {
    // A point cannot contain dimensions
    FimError.throwOnUnreachableCode();
  }

  public containsPoint(point: FimPoint): boolean {
    return this.equals(point);
  }

  public containsRect(_rect: FimRect): never {
    // A point cannot contain a rectangle
    FimError.throwOnUnreachableCode();
  }

  public containedBy(object: FimGeometry): boolean {
    return object.containsPoint(this);
  }

  public toFloor(): FimPoint {
    return new FimPoint(Math.floor(this.x), Math.floor(this.y));
  }

  public rescale(ratio: number): FimPoint {
    return new FimPoint(this.x * ratio, this.y * ratio);
  }

  public toString(): string {
    return `(${this.x},${this.y})`;
  }

  public static fromXY(x: number, y: number): FimPoint {
    return new FimPoint(x, y);
  }
}
