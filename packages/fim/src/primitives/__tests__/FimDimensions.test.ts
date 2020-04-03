// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from '../FimDimensions';
import { FimPoint } from '../FimPoint';
import { FimRect } from '../FimRect';

describe('FimDimensions', () => {

  it('equals()', () => {
    const dim1 = FimDimensions.fromWidthHeight(300, 400);
    const dim2 = FimDimensions.fromWidthHeight(300, 400);
    const dim3 = FimDimensions.fromWidthHeight(400, 300);
    expect(dim1.equals(dim2)).toBeTruthy();
    expect(dim2.equals(dim1)).toBeTruthy();
    expect(dim1.equals(dim3)).toBeFalsy();
    expect(dim3.equals(dim2)).toBeFalsy();
  });

  it('!equals(Points)', () => {
    // Dimensions never equal Points
    const p = FimPoint.fromXY(640, 480);
    const d = FimDimensions.fromWidthHeight(640, 480);
    expect(d.equals(p)).toBeFalsy();
  });

  it('equals(Rectangle)', () => {
    const d = FimDimensions.fromWidthHeight(640, 480);
    const r = FimRect.fromDimensions(d);
    expect(d.equals(r)).toBeTruthy();
  });

  it('Calculates area', () => {
    const dim1 = FimDimensions.fromWidthHeight(300, 400);
    expect(dim1.getArea()).toEqual(120000);

    const dim2 = FimDimensions.fromWidthHeight(30, 40);
    expect(dim2.getArea()).toEqual(1200);
  });

  it('Scales by a multiplier', () => {
    const dim1 = FimDimensions.fromWidthHeight(300, 400);
    const dim2 = dim1.rescale(0.1);
    expect(dim2).toEqual(FimDimensions.fromWidthHeight(30, 40));
  });

  it('Calculates minimum', () => {
    const dim1 = FimDimensions.fromWidthHeight(300, 400);
    const dim2 = FimDimensions.fromWidthHeight(200, 500);
    const dim3 = FimDimensions.min(dim1, dim2);
    expect(dim3).toEqual(FimDimensions.fromWidthHeight(200, 400));
  });

  it('Calculates maximum', () => {
    const dim1 = FimDimensions.fromWidthHeight(300, 400);
    const dim2 = FimDimensions.fromWidthHeight(200, 500);
    const dim3 = FimDimensions.max(dim1, dim2);
    expect(dim3).toEqual(FimDimensions.fromWidthHeight(300, 500));
  });

  it('fitInsideSquare()', () => {
    const originalDim = FimDimensions.fromWidthHeight(640, 480);
    const dim = originalDim.fitInsideSquare(512);
    expect(dim.w).toEqual(512);
    expect(dim.h).toEqual(384);
  });

  it('fitInsideSquare() does not downscale if below max', () => {
    const originalDim = FimDimensions.fromWidthHeight(640, 480);
    const dim = originalDim.fitInsideSquare(1024);
    expect(dim.w).toEqual(640);
    expect(dim.h).toEqual(480);
  });

  it('validateIn(FimDimensions)', () => {
    const d = FimDimensions.fromWidthHeight(640, 480);
    const d1 = FimDimensions.fromWidthHeight(640, 480);
    const d2 = FimDimensions.fromWidthHeight(480, 640);
    d1.validateInDimensions(d);
    expect(() => d2.validateInDimensions(d)).toThrow();
  });

  it('Calculates downscale ratios', () => {
    const dim1 = FimDimensions.fromWidthHeight(1000, 500);
    const dim2 = FimDimensions.fromWidthHeight(100, 50);
    const dim3 = FimDimensions.fromWidthHeight(100, 100);
    const dim4 = FimDimensions.fromWidthHeight(1000, 1000);
    expect(FimDimensions.calculateDownscaleRatio(dim1, dim1)).toEqual(1);
    expect(FimDimensions.calculateDownscaleRatio(dim1, dim2)).toEqual(0.1);
    expect(FimDimensions.calculateDownscaleRatio(dim1, dim3)).toEqual(0.1);
    expect(FimDimensions.calculateDownscaleRatio(dim1, dim4)).toEqual(1);
    expect(FimDimensions.calculateDownscaleRatio(dim2, dim3)).toEqual(1);
    expect(FimDimensions.calculateDownscaleRatio(dim3, dim2)).toEqual(0.5);
    expect(FimDimensions.calculateDownscaleRatio(dim3, dim4)).toEqual(10);
    expect(FimDimensions.calculateDownscaleRatio(dim4, dim3)).toEqual(0.1);
  });

  it('Calculates downscale ratios with rounding errors', () => {
    const from = FimDimensions.fromWidthHeight(480, 640);
    const to = FimDimensions.fromWidthHeight(100, 50);

    // The raw downscale ratio is simply fitting the Y-axis with simple division
    expect(FimDimensions.calculateDownscaleRatio(from, to, false)).toEqual(5 / 64);

    // However, when accounting for toFloor() rounding errors, we may get a slightly higher value as what matters is
    // that the downscaled dimensions are 37x50 (e.g. floor(37.5x50))
    const expectedDimensions = FimDimensions.fromWidthHeight(37, 50);

    const downscale1 = FimDimensions.calculateDownscaleRatio(from, to);
    const dimensions1 = from.rescale(downscale1).toFloor();
    expect(dimensions1).toEqual(expectedDimensions);

    const downscale2 = FimDimensions.calculateDownscaleRatio(from, expectedDimensions);
    const newDimensions2 = from.rescale(downscale2).toFloor();
    expect(newDimensions2).toEqual(expectedDimensions);
  });

  it('Compares aspect ratios', () => {
    const dim = FimDimensions.fromWidthHeight(640, 480);
    const dim1 = FimDimensions.fromWidthHeight(64, 48);
    expect(dim.equalsAspectRatio(dim1)).toBeTruthy();

    const dim2 = FimDimensions.fromWidthHeight(63, 47);
    const dim3 = FimDimensions.fromWidthHeight(65, 49);
    expect(dim.equalsAspectRatio(dim2)).toBeTruthy();
    expect(dim.equalsAspectRatio(dim3)).toBeTruthy();
    expect(dim.equalsAspectRatio(dim2, false)).toBeFalsy();
    expect(dim.equalsAspectRatio(dim3, false)).toBeFalsy();

    const dim4 = FimDimensions.fromWidthHeight(62, 48);
    const dim5 = FimDimensions.fromWidthHeight(64, 46);
    const dim6 = FimDimensions.fromWidthHeight(66, 48);
    const dim7 = FimDimensions.fromWidthHeight(64, 50);
    expect(dim.equalsAspectRatio(dim4)).toBeFalsy();
    expect(dim.equalsAspectRatio(dim5)).toBeFalsy();
    expect(dim.equalsAspectRatio(dim6)).toBeFalsy();
    expect(dim.equalsAspectRatio(dim7)).toBeFalsy();
  });

});
