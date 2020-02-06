// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Simple class for holding a pair of coordinates */
export class FimPoint {
  public readonly x: number;
  public readonly y: number;

  private constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public static fromXY(x: number, y: number): FimPoint {
    return new FimPoint(x, y);
  }
}
