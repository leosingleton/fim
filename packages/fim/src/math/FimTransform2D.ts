// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';

/**
 * Computes transformation matrices for vertexes in a 2-dimensional space.
 *
 * For details, see: https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
 */
export class FimTransform2D {
  public constructor(matrix?: FimTransform2D | number[]) {
    if (matrix) {
      this.matrixValue = FimTransform2D.acceptMatrixOrArray(matrix);
    } else {
      // The default value is an identity matrix
      this.matrixValue = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
  }

  /**
   * A 3x3 transformation matrix. The matrix is expressed as an array of 9 values, in column major order (the way
   * OpenGL expects it).
   */
  public matrixValue: number[];

  /**
   * Transforms a point using this transformation matrix
   * @param point Input X/Y coordinates
   * @returns Transformed X/Y coordinates
   */
  public transformXY(point: FimPoint): FimPoint {
    return FimPoint.fromXY(
      point.x * this.matrixValue[0] + point.y * this.matrixValue[3] + this.matrixValue[6],
      point.x * this.matrixValue[1] + point.y * this.matrixValue[4] + this.matrixValue[7]);
  }

  /**
   * Applies another transformation using matrix multiplication
   * @param matrix Another 3x3 transformation matrix
   */
  public matrixMultiply(matrix: FimTransform2D | number[]): void {
    const left = FimTransform2D.acceptMatrixOrArray(matrix);
    const right = this.matrixValue;

    this.matrixValue = [
      left[0 /*1,1*/] * right[0 /*1,1*/] + left[3 /*1,2*/] * right[1 /*2,1*/] + left[6 /*1,3*/] * right[2 /*3,1*/],
      left[1 /*2,1*/] * right[0 /*1,1*/] + left[4 /*2,2*/] * right[1 /*2,1*/] + left[7 /*2,3*/] * right[2 /*3,1*/],
      left[2 /*3,1*/] * right[0 /*1,1*/] + left[5 /*3,2*/] * right[1 /*2,1*/] + left[8 /*3,3*/] * right[2 /*3,1*/],
      left[0 /*1,1*/] * right[3 /*1,2*/] + left[3 /*1,2*/] * right[4 /*2,2*/] + left[6 /*1,3*/] * right[5 /*3,2*/],
      left[1 /*2,1*/] * right[3 /*1,2*/] + left[4 /*2,2*/] * right[4 /*2,2*/] + left[7 /*2,3*/] * right[5 /*3,2*/],
      left[2 /*3,1*/] * right[3 /*1,2*/] + left[5 /*3,2*/] * right[4 /*2,2*/] + left[8 /*3,3*/] * right[5 /*3,2*/],
      left[0 /*1,1*/] * right[6 /*1,3*/] + left[3 /*1,2*/] * right[7 /*2,3*/] + left[6 /*1,3*/] * right[8 /*3,3*/],
      left[1 /*2,1*/] * right[6 /*1,3*/] + left[4 /*2,2*/] * right[7 /*2,3*/] + left[7 /*2,3*/] * right[8 /*3,3*/],
      left[2 /*3,1*/] * right[6 /*1,3*/] + left[5 /*3,2*/] * right[7 /*2,3*/] + left[8 /*3,3*/] * right[8 /*3,3*/]
    ];
  }

  /**
   * Applies an X/Y translation
   * @param tx X offset (-1 to 1)
   * @param ty Y offset (-1 to 1)
   */
  public translation(tx: number, ty: number): void {
    this.matrixMultiply([1, 0, 0, 0, 1, 0, tx, ty, 1]);
  }

  /**
   * Rotates coordinates by the desired angle
   * @param angle Angle, in radians
   */
  public rotation(angle: number): void {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    this.matrixMultiply([c, s, 0, -s, c, 0, 0, 0, 1]);
  }

  /**
   * Scales coordinates in the X- and Y-direction
   * @param sx X-scale (1 = unchanged)
   * @param sy Y-scale (1 = unchanged)
   */
  public rescale(sx: number, sy: number): void {
    this.matrixMultiply([sx, 0, 0, 0, sy, 0, 0, 0, 1]);
  }

  private static acceptMatrixOrArray(value: FimTransform2D | number[]): number[] {
    const result = (value instanceof FimTransform2D) ? value.matrixValue : value;
    if (result.length !== 9) {
      throw new FimError(FimErrorCode.InvalidParameter, `Invalid length ${result.length}`);
    }

    return result;
  }

  /**
   * Calculates a transformation matrix to position an input texture so that the desired coordinates are showing
   * @param srcCoords Coordinates of the input texture to show, in pixels. Note that these are specified with a
   *    top-left origin, like 2D canvases, not like the bottom-left origin in WebGL.
   * @param srcDimensions Dimensions of the input texture, in pixels (as a rectangle with top-left of 0,0)
   * @returns 2D transformation matrix
   */
  public static fromSrcCoords(srcCoords: FimRect, srcDimensions: FimDimensions): FimTransform2D {
    // Calculate the center points of each rectangle
    const centerCoords = srcCoords.getCenter();
    const centerDimensions = srcDimensions.getCenter();

    // First, translate so that the origin (currently at the center of srcDimensions) is moved to the center of
    // srcCoords (keep in mind Y in inverted)
    const result = new FimTransform2D();
    result.translation((centerDimensions.x - centerCoords.x) * 2 / srcDimensions.w,
      (centerCoords.y - centerDimensions.y) * 2 / srcDimensions.h);

    // Finally, scale to the right size.
    result.rescale(srcDimensions.w / srcCoords.dim.w, srcDimensions.h / srcCoords.dim.h);

    return result;
  }
}
