// src/fim/GuassianKernel.spec.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>

import { GaussianKernel } from '../GaussianKernel';

// Test cases calculated using http://dev.theomader.com/gaussian-kernel-calculator/
describe('GaussianKernel', () => {

  it('sigma=1 size=5', () => {
    let kernel = GaussianKernel.calculate(1, 5);

    expect(kernel.length).toBe(5);
    expect(kernel[0]).toBeCloseTo(0.06136);
    expect(kernel[1]).toBeCloseTo(0.24477);
    expect(kernel[2]).toBeCloseTo(0.38774);
    expect(kernel[3]).toBeCloseTo(0.24477);
    expect(kernel[4]).toBeCloseTo(0.06136);
  });

  it('sigma=2 size=7', () => {
    let kernel = GaussianKernel.calculate(2, 7);

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
    let kernel = GaussianKernel.calculate(4, 9);

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
    let n = GaussianKernel.quantize(kernel);
    expect(kernel[0]).toBeCloseTo(1/15);
    expect(kernel[1]).toBeCloseTo(2/15);
    expect(kernel[2]).toBeCloseTo(3/15);
    expect(kernel[3]).toBeCloseTo(4/15);
    expect(kernel[4]).toBeCloseTo(5/15);
  });

  it('normalize', () => {
    let kernel = [1, 2, 3, 4, 5];
    let n = GaussianKernel.normalize(kernel);
    expect(kernel[0]).toBeCloseTo(1/15);
    expect(kernel[1]).toBeCloseTo(2/15);
    expect(kernel[2]).toBeCloseTo(3/15);
    expect(kernel[3]).toBeCloseTo(4/15);
    expect(kernel[4]).toBeCloseTo(5/15);
  });

});
