// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensional } from './FimDimensional';
import { FimDimensions } from './FimDimensions';
import { FimGeometry } from './FimGeometry';
import { FimPoint } from './FimPoint';

/** Simple class for holding the coordinates of a rectangle */
export class FimRect extends FimGeometry implements FimDimensional {
  /** X-coordinate of the left side */
  public readonly xLeft: number;

  /** Y-coordinate of the top */
  public readonly yTop: number;

  /** X-coordinate of the right side */
  public readonly xRight: number;

  /** Y-coordinate of the bottom */
  public readonly yBottom: number;

  /** Dimensions - width and height */
  public readonly dim: FimDimensions;

  private constructor(xLeft: number, yTop: number, xRight: number, yBottom: number, w: number, h: number) {
    super();

    if (w >= 0) {
      this.xLeft = xLeft;
      this.xRight = xRight;
    } else {
      this.xLeft = xRight;
      this.xRight = xLeft;
      w = -w;
    }

    if (h >= 0) {
      this.yTop = yTop;
      this.yBottom = yBottom;
    } else {
      this.yTop = yBottom;
      this.yBottom = yTop;
      h = -h;
    }

    this.dim = FimDimensions.fromWidthHeight(w, h);
  }

  public equals(object: FimGeometry): boolean {
    const me = this;

    if (object instanceof FimRect) {
      return (me.xRight === object.xRight) && (me.yBottom === object.yBottom) && (me.xLeft === object.xLeft) &&
        (me.yTop === object.yTop);
    } else if (object instanceof FimDimensions) {
      return me.equals(FimRect.fromDimensions(object));
    } else {
      return false;
    }
  }

  public containsDimensions(dimensions: FimDimensions): boolean {
    return this.containsRect(FimRect.fromDimensions(dimensions));
  }

  public containsPoint(point: FimPoint): boolean {
    const me = this;
    return (point.x >= me.xLeft && point.y >= me.yTop && point.x < me.xRight && point.y < me.yBottom);
  }

  public containsRect(rect: FimRect): boolean {
    const me = this;
    return (rect.xLeft >= me.xLeft && rect.yTop >= me.yTop && rect.xRight <= me.xRight && rect.yBottom <= me.yBottom);
  }

  public containedBy(object: FimGeometry): boolean {
    return object.containsRect(this);
  }

  public toFloor(): FimRect {
    return FimRect.fromPoints(this.getTopLeft().toFloor(), this.getBottomRight().toFloor());
  }

  public toString(): string {
    return `${this.getTopLeft()}-${this.getBottomRight()}`;
  }

  /** Returns whether two FimRect objects are the same width and height */
  public sameDimensions(rect: FimRect): boolean {
    return this.dim.equals(rect.dim);
  }

  /** Returns the top-left corner as a point object */
  public getTopLeft(): FimPoint {
    return FimPoint.fromXY(this.xLeft, this.yTop);
  }

  /** Returns the bottom-right corner as a point object */
  public getBottomRight(): FimPoint {
    return FimPoint.fromXY(this.xRight, this.yBottom);
  }

  /** Returns a FimRect whose top-left coordinate is less than its bottom-right */
  public toUpright(): FimRect {
    const me = this;
    return FimRect.fromCoordinates(
      Math.min(me.xLeft, me.xRight),
      Math.min(me.yTop, me.yBottom),
      Math.max(me.xLeft, me.xRight),
      Math.max(me.yTop, me.yBottom)
    );
  }

  /** Returns the area of the rectangle, in pixels */
  public getArea(): number {
    return this.dim.getArea();
  }

  /** Returns the point at the center of the rectangle */
  public getCenter(): FimPoint {
    const me = this;
    return FimPoint.fromXY((me.xLeft + me.xRight) / 2, (me.yTop + me.yBottom) / 2);
  }

  /**
   * Fits this rectangle inside of another
   * @param maxRect Rectangle to fit inside of
   * @returns A rectangle with the same aspect ratio as this, but whose coordinates fit inside of maxRect
   */
  public fit(maxRect: FimRect): FimRect {
    const me = this;
    const scale = Math.min(maxRect.dim.w / me.dim.w, maxRect.dim.h / me.dim.h);
    const width = Math.floor(me.dim.w * scale);
    const height = Math.floor(me.dim.h * scale);
    return FimRect.fromXYWidthHeight(maxRect.xLeft, maxRect.yTop, width, height);
  }

  public static fromDimensions(d: FimDimensions): FimRect {
    return this.fromWidthHeight(d.w, d.h);
  }

  public static fromWidthHeight(width: number, height: number): FimRect {
    return new FimRect(0, 0, width, height, width, height);
  }

  public static fromXYWidthHeight(x: number, y: number, width: number, height: number) {
    return new FimRect(x, y, x + width, y + height, width, height);
  }

  public static fromPointWidthHeight(topLeft: FimPoint, width: number, height: number) {
    return this.fromXYWidthHeight(topLeft.x, topLeft.y, width, height);
  }

  public static fromCoordinates(xLeft: number, yTop: number, xRight: number, yBottom: number): FimRect {
    return new FimRect(xLeft, yTop, xRight, yBottom, xRight - xLeft, yBottom - yTop);
  }

  public static fromPoints(topLeft: FimPoint, bottomRight: FimPoint) {
    return this.fromCoordinates(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y);
  }
}
