// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimPoint } from '../primitives/FimPoint';
import { FimRect } from '../primitives/FimRect';

/**
 * Computes transformation matrices for vertexes in a 2-dimensional space.
 * 
 * For details, see: https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
 */
export class Transform2D {
  public constructor(matrix?: Transform2D | number[]) {
    if (matrix) {
      this.matrix = Transform2D.acceptMatrixOrArray(matrix);
    } else {
      // The default value is an identity matrix
      this.matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
  }

  /**
   * A 3x3 transformation matrix. The matrix is expressed as an array of 9 values, in column major order (the way
   * OpenGL expects it).
   */
  public matrix: number[];

  /**
   * Transforms a point using this transformation matrix
   * @param point Input X/Y coordinates
   * @returns Transformed X/Y coordinates
   */
  public transformXY(point: FimPoint): FimPoint {
    return new FimPoint(
      point.x * this.matrix[0] + point.y * this.matrix[3] + this.matrix[6],
      point.x * this.matrix[1] + point.y * this.matrix[4] + this.matrix[7]);
  }

  /**
   * Applies another transformation using matrix multiplication
   * @param matrix Another 3x3 transformation matrix
   */
  public multiply(matrix: Transform2D | number[]): void {
    let left = Transform2D.acceptMatrixOrArray(matrix);
    let right = this.matrix;

    this.matrix = [
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
    this.multiply([1, 0, 0, 0, 1, 0, tx, ty, 1]);
  }

  /**
   * Rotates coordinates by the desired angle
   * @param angle Angle, in radians
   */
  public rotate(angle: number): void {
    let s = Math.sin(angle);
    let c = Math.cos(angle);
    this.multiply([c, s, 0, -s, c, 0, 0, 0, 1]);
  }

  /**
   * Scales coordinates in the X- and Y-direction
   * @param sx X-scale (1 = unchanged)
   * @param sy Y-scale (1 = unchanged)
   */
  public rescale(sx: number, sy: number): void {
    this.multiply([sx, 0, 0, 0, sy, 0, 0, 0, 1]);
  }

  private static acceptMatrixOrArray(value: Transform2D | number[]): number[] {
    let result = (value instanceof Transform2D) ? value.matrix : value;
    if (result.length !== 9) {
      throw new Error(`Invalid length ${result.length}`);
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
  public static fromSrcCoords(srcCoords: FimRect, srcDimensions: FimRect): Transform2D {
    // Calculate the center points of each rectangle
    let centerCoords = srcCoords.getCenter();
    let centerDimensions = srcDimensions.getCenter();

    // First, translate so that the origin (currently at the center of srcDimensions) is moved to the center of
    // srcCoords (keep in mind Y in inverted)
    let result = new Transform2D();
    result.translation((centerDimensions.x - centerCoords.x) * 2 / srcDimensions.w,
      (centerCoords.y - centerDimensions.y) * 2 / srcDimensions.h);

    // Finally, scale to the right size.
    result.rescale(srcDimensions.w / srcCoords.w, srcDimensions.h / srcCoords.h);

    return result;
  }
}
