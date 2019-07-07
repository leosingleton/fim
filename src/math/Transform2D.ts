// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

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
   * Applies another transformation using matrix multiplication
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

  private static acceptMatrixOrArray(value: Transform2D | number[]): number[] {
    let result = (value instanceof Transform2D) ? value.value : value;
    if (result.length !== 9) {
      throw new Error('Invalid length ' + result.length);
    }

    return result;
  }
}
