// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimTransform3D } from '../FimTransform3D';
import { FimTwoTriangles } from '../FimTwoTriangles';

describe('Transform3D', () => {

  it('Initializes to an identity matrix', () => {
    const mat1 = new FimTransform3D();
    mat1.matrixMultiply(mat1);

    const mat2 = new FimTransform3D();
    expect(mat1.matrixValue).toEqual(mat2.matrixValue);
  });

  it('Multiplies by the identity matrix', () => {
    const mat1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

    // Multiply by the identity matrix
    const mat2 = new FimTransform3D(mat1);
    mat2.matrixMultiply(new FimTransform3D());

    expect(mat2.matrixValue).toEqual(mat1);
  });

  it('Leaves points unchanged by the identity matrix', () => {
    const mat = new FimTransform3D();
    expect(mat.transformXYZW(12, 23)).toEqual([12, 23, 0, 1]);
  });

  it('Translates points', () => {
    const mat = new FimTransform3D();
    mat.translation(-4, 3, 0);
    const point = mat.transformXYZW(12, 23);
    expect(point[0]).toBeCloseTo(8, 8);
    expect(point[1]).toBeCloseTo(26, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

  it('Rotates points', () => {
    const mat = new FimTransform3D();
    mat.rotateZ(Math.PI / 2);
    const point = mat.transformXYZW(12, 23);
    expect(point[0]).toBeCloseTo(-23, 8);
    expect(point[1]).toBeCloseTo(12, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

  it('Scales points', () => {
    const mat = new FimTransform3D();
    mat.rescale(2, 0.5, 1);
    const point = mat.transformXYZW(12, 23);
    expect(point[0]).toBeCloseTo(24, 8);
    expect(point[1]).toBeCloseTo(11.5, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

  it('Transforms vertex arrays', () => {
    const mat = new FimTransform3D(); // Identity matrix
    const vertices = FimTwoTriangles.vertexPositions;
    expect(mat.transformVertexArray(vertices)).toEqual(vertices);
  });

});
