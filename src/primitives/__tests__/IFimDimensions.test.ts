// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { createDimensions } from '../IFimDimensions';

describe('IFimDimensions', () => {

  it('Creates dimensions objects', () => {
    let d = createDimensions(1920, 1080);
    expect(d.w).toEqual(1920);
    expect(d.h).toEqual(1080);
    expect(d.dimensions.getArea()).toEqual(1920 * 1080);
  });

});
