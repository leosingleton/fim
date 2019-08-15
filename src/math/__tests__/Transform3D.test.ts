// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Transform3D } from '../Transform3D';
import { TwoTriangles } from '../TwoTriangles';

describe('Transform3D', () => {

  it('Initializes to an identity matrix', () => {
    let mat1 = new Transform3D();
    mat1.matrixMultiply(mat1);

    let mat2 = new Transform3D();
    expect(mat1.matrixValue).toEqual(mat2.matrixValue);
  });

  it('Multiplies by the identity matrix', () => {
    let mat1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

    // Multiply by the identity matrix
    let mat2 = new Transform3D(mat1);
    mat2.matrixMultiply(new Transform3D());

    expect(mat2.matrixValue).toEqual(mat1);
  });

  it('Leaves points unchanged by the identity matrix', () => {
    let mat = new Transform3D();
    expect(mat.transformXYZW(12, 23)).toEqual([12, 23, 0, 1]);
  });

  it('Translates points', () => {
    let mat = new Transform3D();
    mat.translation(-4, 3, 0);
    let point = mat.transformXYZW(12, 23);
    expect(point[0]).toBeCloseTo(8, 8);
    expect(point[1]).toBeCloseTo(26, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

  it('Rotates points', () => {
    let mat = new Transform3D();
    mat.rotateZ(Math.PI / 2);
    let point = mat.transformXYZW(12, 23);
    expect(point[0]).toBeCloseTo(-23, 8);
    expect(point[1]).toBeCloseTo(12, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

  it('Scales points', () => {
    let mat = new Transform3D();
    mat.rescale(2, 0.5, 1);
    let point = mat.transformXYZW(12, 23);
    expect(point[0]).toBeCloseTo(24, 8);
    expect(point[1]).toBeCloseTo(11.5, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

  it('Transforms vertex arrays', () => {
    let mat = new Transform3D(); // Identity matrix
    let vertices = TwoTriangles.vertexPositions;
    expect(mat.transformVertexArray(vertices)).toEqual(vertices);
  });

});
