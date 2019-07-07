// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Transform2D } from '../Transform2D';
import { FimPoint } from '../../primitives';

describe('Transform2D', () => {

  it('Initializes to an identity matrix', () => {
    let mat1 = new Transform2D();
    mat1.transform(mat1);

    let mat2 = new Transform2D();
    expect(mat1.value).toEqual(mat2.value);
  });

  it('Multiplies by the identity matrix', () => {
    let mat1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Multiply by the identity matrix
    let mat2 = new Transform2D(mat1);
    mat2.transform(new Transform2D());

    expect(mat2.value).toEqual(mat1);
  });

  it('Leaves points unchanged by the identity matrix', () => {
    let point = new FimPoint(12, 23);
    let mat = new Transform2D();
    expect(mat.transformPoint(point)).toEqual(point);
  });

  it('Translates points', () => {
    let point = new FimPoint(12, 23);
    let mat = new Transform2D();
    mat.translate(-4, 3);
    point = mat.transformPoint(point);
    expect(point.x).toBeCloseTo(8, 8);
    expect(point.y).toBeCloseTo(26, 8);
  });

  it('Rotates points', () => {
    let point = new FimPoint(12, 23);
    let mat = new Transform2D();
    mat.rotate(Math.PI / 2);
    point = mat.transformPoint(point);
    expect(point.x).toBeCloseTo(23, 8);
    expect(point.y).toBeCloseTo(-12, 8);
  });

  it('Scales points', () => {
    let point = new FimPoint(12, 23);
    let mat = new Transform2D();
    mat.scale(2, 0.5);
    point = mat.transformPoint(point);
    expect(point.x).toBeCloseTo(24, 8);
    expect(point.y).toBeCloseTo(11.5, 8);
  });

});
