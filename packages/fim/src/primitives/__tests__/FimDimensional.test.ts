// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensional } from '../FimDimensional';
import { FimDimensions } from '../FimDimensions';
import { FimPoint } from '../FimPoint';
import { FimRect } from '../FimRect';

const mockObject: FimDimensional = {
  dim: FimDimensions.fromWidthHeight(640, 480)
};

describe('FimDimensional', () => {

  it('Validates points', () => {
    FimPoint.fromXY(0, 0).validateIn(mockObject);
    expect(() => FimPoint.fromXY(-1, 0).validateIn(mockObject)).toThrow();
    FimPoint.fromXY(100, 100).validateIn(mockObject);
    expect(() => FimPoint.fromXY(100, 500).validateIn(mockObject)).toThrow();
    expect(() => FimPoint.fromXY(640, 480).validateIn(mockObject)).toThrow();
  });

  it('Validates dimensions', () => {
    FimDimensions.fromWidthHeight(100, 100).validateIn(mockObject);
    expect(() => FimDimensions.fromWidthHeight(100, 500).validateIn(mockObject)).toThrow();
  });

  it('Validates rectangles', () => {
    expect(() => FimRect.fromXYWidthHeight(-10, 0, 640, 480).validateIn(mockObject)).toThrow();
    FimRect.fromWidthHeight(100, 100).validateIn(mockObject);
    FimRect.fromWidthHeight(640, 480).validateIn(mockObject);
    expect(() => FimRect.fromWidthHeight(100, 500).validateIn(mockObject)).toThrow();
  });

});
