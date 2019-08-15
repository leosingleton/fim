// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Transform2D } from '../Transform2D';
import { FimPoint } from '../../primitives/FimPoint';
import { FimRect } from '../../primitives/FimRect';

describe('Transform2D', () => {

  it('Initializes to an identity matrix', () => {
    let mat1 = new Transform2D();
    mat1.multiply(mat1);

    let mat2 = new Transform2D();
    expect(mat1.matrix).toEqual(mat2.matrix);
  });

  it('Multiplies by the identity matrix', () => {
    let mat1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Multiply by the identity matrix
    let mat2 = new Transform2D(mat1);
    mat2.multiply(new Transform2D());

    expect(mat2.matrix).toEqual(mat1);
  });

  it('Leaves points unchanged by the identity matrix', () => {
    let point = new FimPoint(12, 23);
    let mat = new Transform2D();
    expect(mat.transformXY(point)).toEqual(point);
  });

  it('Translates points', () => {
    let point = new FimPoint(12, 23);
    let mat = new Transform2D();
    mat.translation(-4, 3);
    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(8, 8);
    expect(point.y).toBeCloseTo(26, 8);
  });

  it('Rotates points', () => {
    let point = new FimPoint(12, 23);
    let mat = new Transform2D();
    mat.rotate(Math.PI / 2);
    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(-23, 8);
    expect(point.y).toBeCloseTo(12, 8);
  });

  it('Scales points', () => {
    let point = new FimPoint(12, 23);
    let mat = new Transform2D();
    mat.rescale(2, 0.5);
    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(24, 8);
    expect(point.y).toBeCloseTo(11.5, 8);
  });

  it('Translates then rotates', () => {
    let point = new FimPoint(12, 23);

    let mat = new Transform2D();
    mat.translation(-4, 3);
    mat.rotate(Math.PI / 2);

    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(-26, 8);
    expect(point.y).toBeCloseTo(8, 8);
  });

  it('Rotates then translates', () => {
    let point = new FimPoint(12, 23);

    let mat = new Transform2D();
    mat.rotate(Math.PI / 2);
    mat.translation(-4, 3);

    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(-27, 8);
    expect(point.y).toBeCloseTo(15, 8);
  });

  it('Calculates matrices based on source coordinates', () => {
    let mat = Transform2D.fromSrcCoords(
      FimRect.fromXYWidthHeight(25, 50, 25, 25),
      FimRect.fromXYWidthHeight(0, 0, 100, 100));

    expect(mat.transformXY(new FimPoint(-1, -1))).toEqual(new FimPoint(-3, -3));
    expect(mat.transformXY(new FimPoint(1, -1))).toEqual(new FimPoint(5, -3));
    expect(mat.transformXY(new FimPoint(-1, 1))).toEqual(new FimPoint(-3, 5));
    expect(mat.transformXY(new FimPoint(1, 1))).toEqual(new FimPoint(5, 5));
  });

});
