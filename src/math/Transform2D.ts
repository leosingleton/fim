// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimPoint } from '../primitives';

/**
 * Computes transformation matrices for vertexes in a 2-dimensional space,
 * 
 * For details, see: https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
 */
export class Transform2D {
  public constructor(matrix?: Transform2D | number[]) {
    if (matrix) {
      this.value = Transform2D.acceptMatrixOrArray(matrix);
    } else {
      // The default value is an identity matrix
      this.value = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
  }

  /**
   * A 3x3 transformation matrix. The matrix is expressed as an array of 9 values, in column major order (the way
   * OpenGL expects it).
   */
  public value: number[];

  /**
   * Transforms a point using this transformation matrix
   * @param point Input X/Y coordinates
   * @returns Transformed X/Y coordinates
   */
  public transformPoint(point: FimPoint): FimPoint {
    return new FimPoint(
      point.x * this.value[0] + point.y * this.value[3] + this.value[6],
      point.x * this.value[1] + point.y * this.value[4] + this.value[7]);
  }

  /**
   * Applies another transformation using matrix multiplication
   * @param matrix Another 3x3 transformation matrix
   */
  public transform(matrix: Transform2D | number[]): void {
    let left = Transform2D.acceptMatrixOrArray(matrix);
    let right = this.value;

    this.value = [
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
  public translate(tx: number, ty: number): void {
    //this.transform([1, 0, tx, 0, 1, ty, 0, 0, 1]);
    this.transform([1, 0, 0, 0, 1, 0, tx, ty, 1]);
  }

  /**
   * Rotates coordinates by the desired angle
   * @param angle Angle, in radians
   */
  public rotate(angle: number): void {
    let s = Math.sin(angle);
    let c = Math.cos(angle);
    this.transform([c, s, 0, -s, c, 0, 0, 0, 1]);
  }

  /**
   * Scales coordinates in the X- and Y-direction
   * @param sx X-scale (1 = unchanged)
   * @param sy Y-scale (1 = unchanged)
   */
  public scale(sx: number, sy: number): void {
    this.transform([sx, 0, 0, 0, sy, 0, 0, 0, 1]);
  }

  private static acceptMatrixOrArray(value: Transform2D | number[]): number[] {
    let result = (value instanceof Transform2D) ? value.value : value;
    if (result.length !== 9) {
      throw new Error('Invalid length ' + result.length);
    }

    return result;
  }
}
