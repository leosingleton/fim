// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGaussianKernel } from '../FimGaussianKernel';

// Test cases calculated using http://dev.theomader.com/gaussian-kernel-calculator/
describe('FimGaussianKernel', () => {

  it('sigma=1 size=5', () => {
    const kernel = FimGaussianKernel.calculate(1, 5);

    expect(kernel.length).toBe(5);
    expect(kernel[0]).toBeCloseTo(0.06136);
    expect(kernel[1]).toBeCloseTo(0.24477);
    expect(kernel[2]).toBeCloseTo(0.38774);
    expect(kernel[3]).toBeCloseTo(0.24477);
    expect(kernel[4]).toBeCloseTo(0.06136);
  });

  it('sigma=2 size=7', () => {
    const kernel = FimGaussianKernel.calculate(2, 7);

    expect(kernel.length).toBe(7);
    expect(kernel[0]).toBeCloseTo(0.071303);
    expect(kernel[1]).toBeCloseTo(0.131514);
    expect(kernel[2]).toBeCloseTo(0.189879);
    expect(kernel[3]).toBeCloseTo(0.214607);
    expect(kernel[4]).toBeCloseTo(0.189879);
    expect(kernel[5]).toBeCloseTo(0.131514);
    expect(kernel[6]).toBeCloseTo(0.071303);
  });

  it('sigma=4 size=9', () => {
    const kernel = FimGaussianKernel.calculate(4, 9);

    expect(kernel.length).toBe(9);
    expect(kernel[0]).toBeCloseTo(0.081812);
    expect(kernel[1]).toBeCloseTo(0.101701);
    expect(kernel[2]).toBeCloseTo(0.118804);
    expect(kernel[3]).toBeCloseTo(0.130417);
    //expect(kernel[4]).toBeCloseTo(0.134535);
    expect(kernel[5]).toBeCloseTo(0.130417);
    expect(kernel[6]).toBeCloseTo(0.118804);
    expect(kernel[7]).toBeCloseTo(0.101701);
    expect(kernel[8]).toBeCloseTo(0.081812);
  });

  it('quantize', () => {
    let kernel = [1, 2, 3, 4, 5];
    kernel = FimGaussianKernel.quantize(kernel);
    expect(kernel[0]).toBeCloseTo(1/15);
    expect(kernel[1]).toBeCloseTo(2/15);
    expect(kernel[2]).toBeCloseTo(3/15);
    expect(kernel[3]).toBeCloseTo(4/15);
    expect(kernel[4]).toBeCloseTo(5/15);
  });

  it('normalize', () => {
    let kernel = [1, 2, 3, 4, 5];
    kernel = FimGaussianKernel.normalizeValues(kernel);
    expect(kernel[0]).toBeCloseTo(1/15);
    expect(kernel[1]).toBeCloseTo(2/15);
    expect(kernel[2]).toBeCloseTo(3/15);
    expect(kernel[3]).toBeCloseTo(4/15);
    expect(kernel[4]).toBeCloseTo(5/15);
  });

});
