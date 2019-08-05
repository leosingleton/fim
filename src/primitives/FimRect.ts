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
    if (w >= 0) {
      this.xLeft = xLeft;
      this.xRight = xRight;
      this.w = w;
    } else {
      this.xLeft = xRight;
      this.xRight = xLeft;
      this.w = -w;
    }

    if (h >= 0) {
      this.yTop = yTop;
      this.yBottom = yBottom;
      this.h = h;  
    } else {
      this.yTop = yBottom;
      this.yBottom = yTop;
      this.h = -h;
    }
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

  /** Returns the point at the center of the rectangle */
  getCenter(): FimPoint {
    return new FimPoint((this.xLeft + this.xRight) / 2, (this.yTop + this.yBottom) / 2);
  }

  /** Scales a rectangle by a multiplier */
  scale(ratio: number): FimRect {
    return FimRect.fromCoordinates(this.xLeft * ratio, this.yTop * ratio, this.xRight * ratio, this.yBottom * ratio);
  }

  /**
   * Fits this rectangle inside of another
   * @param maxRect Rectangle to fit inside of
   * @returns A rectangle with the same aspect ratio as this, but whose coordinates fit inside of maxRect
   */
  fit(maxRect: FimRect): FimRect {
    let scale = Math.min(maxRect.w / this.w, maxRect.h / this.h);
    let width = Math.floor(this.w * scale);
    let height = Math.floor(this.h * scale);
    return FimRect.fromXYWidthHeight(maxRect.xLeft, maxRect.yTop, width, height);
  }

  static fromWidthHeight(width: number, height: number): FimRect {
    return new FimRect(0, 0, width, height, width, height);
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

  /**
   * Downscales a set of dimensions, preserving aspect ratio
   * @param width Input width
   * @param height Input height
   * @param maxDimension Maximum value of either width or height
   * @returns Downscaled FimRect with the same aspect ratio as the original. Note that the dimensions are rounded
   *    to the nearest pixel, so the aspect ratio may be slightly different due to rounding errors.
   */
  static downscaleToMaxDimension(width: number, height: number, maxDimension: number): FimRect {
    let scale = Math.min(maxDimension / width, maxDimension / height);
    let w = Math.floor(width * scale);
    let h = Math.floor(height * scale);
    return FimRect.fromXYWidthHeight(0, 0, w, h);
  }
}
