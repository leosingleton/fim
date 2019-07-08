// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Transform3D } from '../Transform3D';

describe('Transform3D', () => {

  it('Initializes to an identity matrix', () => {
    let mat1 = new Transform3D();
    mat1.transform(mat1);

    let mat2 = new Transform3D();
    expect(mat1.value).toEqual(mat2.value);
  });

  it('Multiplies by the identity matrix', () => {
    let mat1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

    // Multiply by the identity matrix
    let mat2 = new Transform3D(mat1);
    mat2.transform(new Transform3D());

    expect(mat2.value).toEqual(mat1);
  });

  it('Leaves points unchanged by the identity matrix', () => {
    let mat = new Transform3D();
    expect(mat.transformPoint(12, 23)).toEqual([12, 23, 0, 1]);
  });

  it('Translates points', () => {
    let mat = new Transform3D();
    mat.translate(-4, 3, 0);
    let point = mat.transformPoint(12, 23);
    expect(point[0]).toBeCloseTo(8, 8);
    expect(point[1]).toBeCloseTo(26, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

  it('Rotates points', () => {
    let mat = new Transform3D();
    mat.rotateZ(Math.PI / 2);
    let point = mat.transformPoint(12, 23);
    expect(point[0]).toBeCloseTo(-23, 8);
    expect(point[1]).toBeCloseTo(12, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

  it('Scales points', () => {
    let mat = new Transform3D();
    mat.scale(2, 0.5, 1);
    let point = mat.transformPoint(12, 23);
    expect(point[0]).toBeCloseTo(24, 8);
    expect(point[1]).toBeCloseTo(11.5, 8);
    expect(point[2]).toBeCloseTo(0, 8);
    expect(point[3]).toBeCloseTo(1, 8);
  });

});
