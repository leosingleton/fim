// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { createDimensions, rescale, rescaleDimensions } from '../IFimDimensions';

describe('IFimDimensions', () => {

  it('Creates dimensions objects', () => {
    let d = createDimensions(1920, 1080);
    expect(d.w).toEqual(1920);
    expect(d.h).toEqual(1080);
    expect(d.dimensions.getArea()).toEqual(1920 * 1080);
  });

  it('Downscales dimensions', () => {
    let d2 = rescale(640, 480, 512);
    expect(d2.w).toEqual(512);
    expect(d2.h).toEqual(384);
    expect(d2.dimensions.getArea()).toEqual(512 * 384);
  });

  it('Upscales dimensions', () => {
    let d = createDimensions(1080, 1920);
    let d2 = rescaleDimensions(d, 4096);
    expect(d2.w).toEqual(2304);
    expect(d2.h).toEqual(4096);
    expect(d2.dimensions.getArea()).toEqual(2304 * 4096);
  });

});
