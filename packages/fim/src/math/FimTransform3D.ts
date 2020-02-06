// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimTransform2D } from './FimTransform2D';
import { FimError, FimErrorCode } from '../primitives/FimError';

/**
 * Computes transformation matrices for vertexes in a 3-dimensional space.
 *
 * For details, see: https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html
 */
export class FimTransform3D {
  public constructor(matrix?: FimTransform2D | FimTransform3D | number[]) {
    if (matrix) {
      this.matrixValue = FimTransform3D.acceptMatrixOrArray(matrix);
    } else {
      // The default value is an identity matrix
      this.matrixValue = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }
  }

  /**
   * A 4x4 transformation matrix. The matrix is expressed as an array of 16 values, in column major order (the way
   * OpenGL expects it).
   */
  public matrixValue: number[];

  /**
   * Transforms a point using this transformation matrix
   * @param point Input coordinates (vec2, vec3, or vec4)
   * @returns Array containing transformed vec4
   */
  public transformXYZW(x: number, y: number, z = 0, w = 1): number[] {
    const matrix = this.matrixValue;
    return [
      x * matrix[0] + y * matrix[4] + z * matrix[8]  + w * matrix[12],
      x * matrix[1] + y * matrix[5] + z * matrix[9]  + w * matrix[13],
      x * matrix[2] + y * matrix[6] + z * matrix[10] + w * matrix[14],
      x * matrix[3] + y * matrix[7] + z * matrix[11] + w * matrix[15]
    ];
  }

  /** Transforms an array of vec4 vertices using this transformation matrix */
  public transformVertexArray(values: number[]): number[] {
    // Ensure the input is an array of size 4 vectors
    if (values.length % 4 !== 0) {
      throw new FimError(FimErrorCode.AppError, 'ArraySize');
    }

    const result = [];
    for (let n = 0; n < values.length; n += 4) {
      const rr = this.transformXYZW(values[n], values[n + 1], values[n + 2], values[n + 3]);
      result[n] = rr[0];
      result[n + 1] = rr[1];
      result[n + 2] = rr[2];
      result[n + 3] = rr[3];
    }

    return result;
  }

  /**
   * Applies another transformation using matrix multiplication
   * @param matrix Another 3x3 or 4x4 transformation matrix
   */
  public matrixMultiply(matrix: FimTransform2D | FimTransform3D | number[]): void {
    const left = FimTransform3D.acceptMatrixOrArray(matrix);
    const right = this.matrixValue;

    this.matrixValue = [
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
  public translation(tx: number, ty: number, tz: number): void {
    this.matrixMultiply([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1]);
  }

  /**
   * Rotates coordinates by the desired angle along the X-axis
   * @param angle Angle, in radians
   */
  public rotateX(angle: number): void {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    this.matrixMultiply([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }

  /**
   * Rotates coordinates by the desired angle along the Y-axis
   * @param angle Angle, in radians
   */
  public rotateY(angle: number): void {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    this.matrixMultiply([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  /**
   * Rotates coordinates by the desired angle along the Z-axis
   * @param angle Angle, in radians
   */
  public rotateZ(angle: number): void {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    this.matrixMultiply([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /**
   * Scales coordinates in the X- and Y-direction
   * @param sx X-scale (1 = unchanged)
   * @param sy Y-scale (1 = unchanged)
   * @param sz Z-scale (1 = unchanged)
   */
  public rescale(sx: number, sy: number, sz: number): void {
    this.matrixMultiply([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]);
  }

  private static acceptMatrixOrArray(value: FimTransform2D | FimTransform3D | number[]): number[] {
    let result = (value instanceof FimTransform2D || value instanceof FimTransform3D) ? value.matrixValue : value;
    if (result.length === 9) {
      // Special case: We support 2D 3x3 matrices as inputs. Do the conversion to 4x4.
      const o = result;
      result = [
        o[0], o[1],    0, o[2],
        o[3], o[4],    0, o[5],
           0,    0,    1,    0,
        o[6], o[7],    0, o[8]
      ];
    } else if (result.length !== 16) {
      throw new FimError(FimErrorCode.AppError, `Invalid length ${result.length}`);
    }

    return result;
  }
}
