// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Transform2D } from './Transform2D';

/**
 * Computes transformation matrices for vertexes in a 3-dimensional space,
 */
export class Transform3D {
  public constructor(matrix?: Transform2D | Transform3D | number[]) {
    if (matrix) {
      this.value = Transform3D.acceptMatrixOrArray(matrix);
    } else {
      // The default value is an identity matrix
      this.value = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }
  }

  /**
   * A 4x4 transformation matrix. The matrix is expressed as an array of 16 values, in column major order (the way
   * OpenGL expects it).
   */
  public value: number[];

  /**
   * Transforms a point using this transformation matrix
   * @param point Input coordinates (vec2, vec3, or vec4)
   * @returns Array containing transformed vec4
   */
  public transformPoint(x: number, y: number, z = 0, w = 1): number[] {
    return [
      x * this.value[0] + y * this.value[4] + z * this.value[8]  + w * this.value[12],
      x * this.value[1] + y * this.value[5] + z * this.value[9]  + w * this.value[13],
      x * this.value[2] + y * this.value[6] + z * this.value[10] + w * this.value[14],
      x * this.value[3] + y * this.value[7] + z * this.value[11] + w * this.value[15]
    ];
  }

  /**
   * Applies another transformation using matrix multiplication
   * @param matrix Another 3x3 or 4x4 transformation matrix
   */
  public transform(matrix: Transform2D | Transform3D | number[]): void {
    let left = Transform3D.acceptMatrixOrArray(matrix);
    let right = this.value;

    this.value = [
      left[0] * right[0]  + left[4] * right[1]  + left[8]  * right[2]  + left[12] * right[3],
      left[1] * right[0]  + left[5] * right[1]  + left[9]  * right[2]  + left[13] * right[3],
      left[2] * right[0]  + left[6] * right[1]  + left[10] * right[2]  + left[14] * right[3],
      left[3] * right[0]  + left[7] * right[1]  + left[11] * right[2]  + left[15] * right[3],
      left[0] * right[4]  + left[4] * right[5]  + left[8]  * right[6]  + left[12] * right[7],
      left[1] * right[4]  + left[5] * right[5]  + left[9]  * right[6]  + left[13] * right[7],
      left[2] * right[4]  + left[6] * right[5]  + left[10] * right[6]  + left[14] * right[7],
      left[3] * right[4]  + left[7] * right[5]  + left[11] * right[6]  + left[15] * right[7],
      left[0] * right[8]  + left[4] * right[9]  + left[8]  * right[10] + left[12] * right[11],
      left[1] * right[8]  + left[5] * right[9]  + left[9]  * right[10] + left[13] * right[11],
      left[2] * right[8]  + left[6] * right[9]  + left[10] * right[10] + left[14] * right[11],
      left[3] * right[8]  + left[7] * right[9]  + left[11] * right[10] + left[15] * right[11],
      left[0] * right[12] + left[4] * right[13] + left[8]  * right[14] + left[12] * right[15],
      left[1] * right[12] + left[5] * right[13] + left[9]  * right[14] + left[13] * right[15],
      left[2] * right[12] + left[6] * right[13] + left[10] * right[14] + left[14] * right[15],
      left[3] * right[12] + left[7] * right[13] + left[11] * right[14] + left[15] * right[15]
    ];
  }

  /**
   * Applies an X/Y/Z translation
   * @param tx X offset (-1 to 1)
   * @param ty Y offset (-1 to 1)
   * @param tz Z offset (-1 to 1)
   */
  public translate(tx: number, ty: number, tz: number): void {
    this.transform([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1]);
  }

  /**
   * Rotates coordinates by the desired angle along the X-axis
   * @param angle Angle, in radians
   */
  public rotateX(angle: number): void {
    let s = Math.sin(angle);
    let c = Math.cos(angle);
    this.transform([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }

  /**
   * Rotates coordinates by the desired angle along the Y-axis
   * @param angle Angle, in radians
   */
  public rotateY(angle: number): void {
    let s = Math.sin(angle);
    let c = Math.cos(angle);
    this.transform([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  /**
   * Rotates coordinates by the desired angle along the Z-axis
   * @param angle Angle, in radians
   */
  public rotateZ(angle: number): void {
    let s = Math.sin(angle);
    let c = Math.cos(angle);
    this.transform([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /**
   * Scales coordinates in the X- and Y-direction
   * @param sx X-scale (1 = unchanged)
   * @param sy Y-scale (1 = unchanged)
   * @param sz Z-scale (1 = unchanged)
   */
  public scale(sx: number, sy: number, sz: number): void {
    this.transform([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]);
  }

  private static acceptMatrixOrArray(value: Transform2D | Transform3D | number[]): number[] {
    let result = (value instanceof Transform2D || value instanceof Transform3D) ? value.value : value;
    if (result.length === 9) {
      // Special case: We support 2D 3x3 matrices as inputs. Do the conversion to 4x4.
      let o = result;
      result = [
        o[0], o[1],    0, o[2],
        o[3], o[4],    0, o[5],
           0,    0,    1,    0,
        o[6], o[7],    0, o[8]
      ];
    } else if (result.length !== 16) {
      throw new Error('Invalid length ' + result.length);
    }

    return result;
  }
}
