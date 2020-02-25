// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Simple class for holding a set of dimensions */
export class FimDimensions {
  /** Width */
  public readonly w: number;

  /** Height */
  public readonly h: number;

  private constructor(width: number, height: number) {
    this.w = width;
    this.h = height;
  }

  /** Compares two FimDimensions objects */
  public equals(d: FimDimensions): boolean {
    return (this.w === d.w) && (this.h === d.h);
  }

  /** Returns the area of the rectangle, in pixels */
  public getArea(): number {
    return this.w * this.h;
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

  public toFloor(): FimDimensions {
    return new FimDimensions(Math.floor(this.w), Math.floor(this.h));
  }

  public static fromWidthHeight(width: number, height: number): FimDimensions {
    return new FimDimensions(width, height);
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
