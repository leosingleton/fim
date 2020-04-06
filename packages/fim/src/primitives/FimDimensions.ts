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

  public rescale(ratio: number): FimDimensions {
    return new FimDimensions(this.w * ratio, this.h * ratio);
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

  /**
   * Downscales the current dimensions to fit inside of the requested maximum dimensions, while preserving the original
   * aspect ratio
   * @param maxDimensions Maximum dimensions to fit inside of
   * @returns Downscaled dimensions. May be the original dimensions if they already fit. Also note that the values may
   *    be non-integers, so the caller may want to call `toFloor()` on the result.
   */
  public fitInside(maxDimensions: FimDimensions): FimDimensions {
    const me = this;
    if (me.w <= maxDimensions.w && me.h <= maxDimensions.h) {
      return me;
    }

    return me.rescale(Math.min(maxDimensions.w / me.w, maxDimensions.h / me.h));
  }

  /**
   * Downscales the current dimensions to fit inside a square of the requested maximum dimension while preserving the
   * original aspect ratio
   * @param maxDimension Dimension of one side of the maximum square
   * @returns Downscaled dimensions. May be the original dimensions if they already fit. Also note that the values may
   *    be non-integers, so the caller may want to call `toFloor()` on the result.
   */
  public fitInsideSquare(maxDimension: number): FimDimensions {
    return this.fitInside(FimDimensions.fromSquareDimension(maxDimension));
  }

  /**
   * Compares this object to another `FimDimensions` object and returns whether their aspect ratios are equal
   * @param dimensions Other `FimDimensions` object to compare
   * @param withinOnePixel If enabled (default), returns `true` as long as the aspect ratios are within one pixel of
   *    each other.
   * @returns `true` if the aspect ratios match (or are within one pixel); `false` otherwise
   */
  public equalsAspectRatio(dimensions: FimDimensions, withinOnePixel = true): boolean {
    return FimDimensions.equalsAspectRatio(this, dimensions, withinOnePixel);
  }

  public static fromWidthHeight(width: number, height: number): FimDimensions {
    return new FimDimensions(width, height);
  }

  public static fromSquareDimension(dimension: number): FimDimensions {
    return new FimDimensions(dimension, dimension);
  }

  /**
   * Creates a `FimDimensions` object from any object containing `width` and `height` properties
   * @param object Any object containing `width` and `height` properties
   */
  public static fromObject(object: { width: number, height: number }): FimDimensions {
    return new FimDimensions(object.width, object.height);
  }

  public static min(d1: FimDimensions, d2: FimDimensions): FimDimensions {
    return new FimDimensions(Math.min(d1.w, d2.w), Math.min(d1.h, d2.h));
  }

  public static max(d1: FimDimensions, d2: FimDimensions): FimDimensions {
    return new FimDimensions(Math.max(d1.w, d2.w), Math.max(d1.h, d2.h));
  }

  /**
   * Calculates the downscale ratio to fit a larger set of `FimDimensions` inside of a smaller set of `FimDimensions`
   * @param larger Original `FimDimensions` object
   * @param smaller `FimDimensions` object to fit inside of
   * @param withFloor If `true` (default), solves so that `larger.rescale(result).toFloor()` fits inside `smaller`.
   *    Otherwise, if `false`, solves so that `larger.rescale(result)` fits inside `smaller`.
   * @returns Downscale ratio
   */
  public static calculateDownscaleRatio(larger: FimDimensions, smaller: FimDimensions, withFloor = true): number {
    const ratioW = smaller.w / larger.w;
    const ratioH = smaller.h / larger.h;
    const ratio = Math.min(ratioW, ratioH);

    if (withFloor) {
      // In some cases, the smaller parameter may be an already-downscaled set of dimensions created from larger.
      // Repetetive rescale() plus toFloor() calls will cause cumulative rounding errors, as each toFloor() operation
      // may subtract up to one pixel. To mitigate this, we check whether the larger ratio of the two fits within
      // smaller after the toFloor() operation, and if so, return that value instead.
      const maxRatio = Math.max(ratioW, ratioH);
      if (larger.rescale(maxRatio).toFloor().equals(smaller)) {
        return maxRatio;
      }
    }

    return ratio;
  }

  /**
   * Compares two `FimDimensions` objects and returns whether their aspect ratios are equal
   * @param dimensions Another `FimDimensions` object to compare
   * @param withinOnePixel If enabled (default), returns `true` as long as the aspect ratios are within one pixel of
   *    each other.
   * @returns `true` if the aspect ratios match (or are within one pixel); `false` otherwise
   */
  public static equalsAspectRatio(dimensions1: FimDimensions, dimensions2: FimDimensions, withinOnePixel = true):
      boolean {
    const ratio1 = dimensions1.w / dimensions1.h;
    const ratio2 = dimensions2.w / dimensions2.h;
    if (ratio1 === ratio2) {
      return true;
    }

    if (withinOnePixel) {
      // Determine the aspect ratios if they were changed by one pixel in any direction
      const ratio1w = (dimensions1.w - 1) / dimensions1.h;
      const ratio1h = dimensions1.w / (dimensions1.h - 1);
      const ratio2w = (dimensions2.w - 1) / dimensions2.h;
      const ratio2h = dimensions2.w / (dimensions2.h - 1);

      // Determine the range of aspect ratios for both
      const ratio1min = Math.min(ratio1w, ratio1h);
      const ratio1max = Math.max(ratio1w, ratio1h);
      const ratio2min = Math.min(ratio2w, ratio2h);
      const ratio2max = Math.max(ratio2w, ratio2h);

      // Determine if there is any overlap in the two ranges
      return (ratio1min <= ratio2max) && (ratio2min < ratio1max);
    }

    return false;
  }
}
