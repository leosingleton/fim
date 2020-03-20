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

  it('Downscales dimensions', () => {
    const dim = FimDimensions.downscaleToMaxDimension(640, 480, 512);
    expect(dim.w).toEqual(512);
    expect(dim.h).toEqual(384);
  });

  it('Does not downscale if below max', () => {
    const dim = FimDimensions.downscaleToMaxDimension(640, 480, 1024);
    expect(dim.w).toEqual(640);
    expect(dim.h).toEqual(480);
  });

});
