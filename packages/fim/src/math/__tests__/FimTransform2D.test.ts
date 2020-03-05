// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimTransform2D } from '../FimTransform2D';
import { FimDimensions } from '../../primitives/FimDimensions';
import { FimPoint } from '../../primitives/FimPoint';
import { FimRect } from '../../primitives/FimRect';

describe('Transform2D', () => {

  it('Initializes to an identity matrix', () => {
    const mat1 = new FimTransform2D();
    mat1.matrixMultiply(mat1);

    const mat2 = new FimTransform2D();
    expect(mat1.matrixValue).toEqual(mat2.matrixValue);
  });

  it('Multiplies by the identity matrix', () => {
    const mat1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Multiply by the identity matrix
    const mat2 = new FimTransform2D(mat1);
    mat2.matrixMultiply(new FimTransform2D());

    expect(mat2.matrixValue).toEqual(mat1);
  });

  it('Leaves points unchanged by the identity matrix', () => {
    const point = FimPoint.fromXY(12, 23);
    const mat = new FimTransform2D();
    expect(mat.transformXY(point)).toEqual(point);
  });

  it('Translates points', () => {
    let point = FimPoint.fromXY(12, 23);
    const mat = new FimTransform2D();
    mat.translation(-4, 3);
    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(8, 8);
    expect(point.y).toBeCloseTo(26, 8);
  });

  it('Rotates points', () => {
    let point = FimPoint.fromXY(12, 23);
    const mat = new FimTransform2D();
    mat.rotation(Math.PI / 2);
    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(-23, 8);
    expect(point.y).toBeCloseTo(12, 8);
  });

  it('Scales points', () => {
    let point = FimPoint.fromXY(12, 23);
    const mat = new FimTransform2D();
    mat.rescale(2, 0.5);
    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(24, 8);
    expect(point.y).toBeCloseTo(11.5, 8);
  });

  it('Translates then rotates', () => {
    let point = FimPoint.fromXY(12, 23);

    const mat = new FimTransform2D();
    mat.translation(-4, 3);
    mat.rotation(Math.PI / 2);

    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(-26, 8);
    expect(point.y).toBeCloseTo(8, 8);
  });

  it('Rotates then translates', () => {
    let point = FimPoint.fromXY(12, 23);

    const mat = new FimTransform2D();
    mat.rotation(Math.PI / 2);
    mat.translation(-4, 3);

    point = mat.transformXY(point);
    expect(point.x).toBeCloseTo(-27, 8);
    expect(point.y).toBeCloseTo(15, 8);
  });

  it('Calculates matrices based on source coordinates', () => {
    const mat = FimTransform2D.fromSrcCoords(
      FimRect.fromXYWidthHeight(25, 50, 25, 25),
      FimDimensions.fromWidthHeight(100, 100));

    expect(mat.transformXY(FimPoint.fromXY(-1, -1))).toEqual(FimPoint.fromXY(-3, -3));
    expect(mat.transformXY(FimPoint.fromXY(1, -1))).toEqual(FimPoint.fromXY(5, -3));
    expect(mat.transformXY(FimPoint.fromXY(-1, 1))).toEqual(FimPoint.fromXY(-3, 5));
    expect(mat.transformXY(FimPoint.fromXY(1, 1))).toEqual(FimPoint.fromXY(5, 5));
  });

});
