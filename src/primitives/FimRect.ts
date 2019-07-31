// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimPoint } from './FimPoint';

/** Simple class for holding the coordinates of a rectangle */
export class FimRect {
  /** X-coordinate of the left side */
  readonly xLeft: number;

  /** Y-coordinate of the top */
  readonly yTop: number;

  /** X-coordinate of the right side */
  readonly xRight: number;

  /** Y-coordinate of the bottom */
  readonly yBottom: number;

  /** Width */
  readonly w: number;

  /** Height */
  readonly h: number;

  private constructor(xLeft: number, yTop: number, xRight: number, yBottom: number, w: number, h: number) {
    this.xLeft = xLeft;
    this.yTop = yTop;
    this.xRight = xRight;
    this.yBottom = yBottom;
    this.w = w;
    this.h = h;
  }

  /** Compares two FimRect objects */
  equals(rect: FimRect): boolean {
    return (this.xRight === rect.xRight) && (this.yBottom == rect.yBottom) &&
      (this.xLeft === rect.xLeft) && (this.yTop === rect.yTop);
  }

  /** Returns whether two FimRect objects are the same width and height */
  sameDimensions(rect: FimRect): boolean {
    return (this.w === rect.w) && (this.h === rect.h);
  }

  /** Returns the top-left corner as a point object */
  getTopLeft(): FimPoint {
    return new FimPoint(this.xLeft, this.yTop);
  }

  /** Returns the bottom-right corner as a point object */
  getBottomRight(): FimPoint {
    return new FimPoint(this.xRight, this.yBottom);
  }

  /** Returns a FimRect whose top-left coordinate is less than its bottom-right */
  toUpright(): FimRect {
    return FimRect.fromCoordinates(
      Math.min(this.xLeft, this.xRight),
      Math.min(this.yTop, this.yBottom),
      Math.max(this.xLeft, this.xRight),
      Math.max(this.yTop, this.yBottom)
    );
  }

  /** Returns the area of the rectangle, in pixels */
  getArea(): number {
    return this.w * this.h;
  }

  /** Scales a rectangle by a multiplier */
  scale(ratio: number): FimRect {
    return FimRect.fromCoordinates(this.xLeft * ratio, this.yTop * ratio, this.xRight * ratio, this.yBottom * ratio);
  }

  /**
   * Rescales this rectangle, preserving aspect ratio
   * @param maxDimension Maximum value of either width or height
   * @returns Downscaled rectangle with the same aspect ratio as the original and xLeft/yTop. Note that the dimensions
   *    are rounded to the nearest pixel, so the aspect ratio may be slightly different due to rounding errors.
   */
  rescale(maxDimension: number): FimRect {
    let scale = Math.min(maxDimension / this.w, maxDimension / this.h);
    let width = Math.floor(this.w * scale);
    let height = Math.floor(this.h * scale);
    return FimRect.fromXYWidthHeight(this.xLeft, this.yTop, width, height);
  }

  static fromXYWidthHeight(x: number, y: number, width: number, height: number) {
    return new FimRect(x, y, x + width, y + height, width, height);
  }

  static fromPointWidthHeight(topLeft: FimPoint, width: number, height: number) {
    return this.fromXYWidthHeight(topLeft.x, topLeft.y, width, height);
  }

  static fromCoordinates(xLeft: number, yTop: number, xRight: number, yBottom: number): FimRect {
    return new FimRect(xLeft, yTop, xRight, yBottom, xRight - xLeft, yBottom - yTop);
  }

  static fromPoints(topLeft: FimPoint, bottomRight: FimPoint) {
    return this.fromCoordinates(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y);
  }
}
