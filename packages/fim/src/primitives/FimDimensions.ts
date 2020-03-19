// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGeometry } from './FimGeometry';
import { FimPoint } from './FimPoint';
import { FimRect } from './FimRect';

/** Simple class for holding a set of dimensions */
export class FimDimensions extends FimGeometry {
  /** Width */
  public readonly w: number;

  /** Height */
  public readonly h: number;

  private constructor(width: number, height: number) {
    super();
    this.w = width;
    this.h = height;
  }

  public equals(object: FimGeometry): boolean {
    if (object instanceof FimDimensions) {
      return (this.w === object.w) && (this.h === object.h);
    } else if (object instanceof FimRect) {
      return FimRect.fromDimensions(this).equals(object);
    } else {
      return false;
    }
  }

  public containsDimensions(dimensions: FimDimensions): boolean {
    return (dimensions.w <= this.w && dimensions.h <= this.h);
  }

  public containsPoint(point: FimPoint): boolean {
    return (point.x >= 0 && point.y >= 0 && point.x <= (this.w - 1) && point.y <= (this.h - 1));
  }

  public containsRect(rect: FimRect): boolean {
    const me = this;
    return (rect.xLeft >= 0 && rect.yTop >= 0 && rect.xRight <= me.w && rect.yBottom <= me.h);
  }

  public containedBy(dimensions: FimDimensions): boolean {
    return dimensions.containsDimensions(this);
  }

  public toFloor(): FimDimensions {
    return new FimDimensions(Math.floor(this.w), Math.floor(this.h));
  }

  public toString(): string {
    return `${this.w}x${this.h}`;
  }

  /** Returns the area of the rectangle, in pixels */
  public getArea(): number {
    return this.w * this.h;
  }

  /** Returns the point at the center of the rectangle */
  public getCenter(): FimPoint {
    return FimPoint.fromXY(this.w / 2, this.h / 2);
  }

  /** Scales a rectangle by a multiplier */
  public rescale(ratio: number): FimDimensions {
    return new FimDimensions(this.w * ratio, this.h * ratio);
  }

  /**
   * Downscales this to a maximum dimension, preserving aspect ratio
   * @param maxDimension Maximum value of either width or height
   * @returns Downscaled FimDimensions with the same aspect ratio as this one. Note that the dimensions are rounded
   *    to the nearest pixel, so the aspect ratio may be slightly different due to rounding errors.
   */
  public downscaleToMaxDimension(maxDimension: number): FimDimensions {
    return FimDimensions.downscaleToMaxDimension(this.w, this.h, maxDimension);
  }

  public static fromWidthHeight(width: number, height: number): FimDimensions {
    return new FimDimensions(width, height);
  }

  public static fromSquareDimension(dimension: number): FimDimensions {
    return new FimDimensions(dimension, dimension);
  }

  public static min(d1: FimDimensions, d2: FimDimensions): FimDimensions {
    return new FimDimensions(Math.min(d1.w, d2.w), Math.min(d1.h, d2.h));
  }

  public static max(d1: FimDimensions, d2: FimDimensions): FimDimensions {
    return new FimDimensions(Math.max(d1.w, d2.w), Math.max(d1.h, d2.h));
  }

  /**
   * Downscales a set of dimensions, preserving aspect ratio
   * @param width Input width
   * @param height Input height
   * @param maxDimension Maximum value of either width or height
   * @returns Downscaled FimDimensions with the same aspect ratio as the original. Note that the dimensions are rounded
   *    to the nearest pixel, so the aspect ratio may be slightly different due to rounding errors.
   */
  public static downscaleToMaxDimension(width: number, height: number, maxDimension: number): FimDimensions {
    if (width <= maxDimension && height <= maxDimension) {
      return new FimDimensions(width, height);
    }

    const scale = Math.min(maxDimension / width, maxDimension / height);
    return new FimDimensions(width * scale, height * scale).toFloor();
  }
}
