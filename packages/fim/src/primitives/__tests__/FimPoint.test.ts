// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions } from '../FimDimensions';
import { FimPoint } from '../FimPoint';
import { FimRect } from '../FimRect';

describe('FimPoint', () => {

  it('Constructs from x/y', () => {
    const p = FimPoint.fromXY(640, 480);
    expect(p.x).toEqual(640);
    expect(p.y).toEqual(480);
  });

  it('equals()', () => {
    const p1 = FimPoint.fromXY(640, 480);
    const p2 = FimPoint.fromXY(480, 640);
    expect(p1.equals(p1)).toBeTruthy();
    expect(p2.equals(p2)).toBeTruthy();
    expect(p1.equals(p2)).toBeFalsy();
    expect(p2.equals(p1)).toBeFalsy();
  });

  it('!equals(Dimensions or Rectangles)', () => {
    // Points never equal Dimensions or Rectangles
    const p = FimPoint.fromXY(640, 480);
    const d = FimDimensions.fromWidthHeight(640, 480);
    const r = FimRect.fromDimensions(d);
    expect(p.equals(d)).toBeFalsy();
    expect(p.equals(r)).toBeFalsy();
  });

  it('containsPoint()', () => {
    const p1 = FimPoint.fromXY(640, 480);
    const p2 = FimPoint.fromXY(480, 640);
    expect(p1.containsPoint(p1)).toBeTruthy();
    expect(p1.containsPoint(p2)).toBeFalsy();
  });

  it('validateIn(FimDimensions)', () => {
    const d = FimDimensions.fromWidthHeight(640, 480);
    const p1 = FimPoint.fromXY(639, 479);
    const p2 = FimPoint.fromXY(480, 640);
    const p3 = FimPoint.fromXY(20, -10);
    p1.validateInDimensions(d);
    expect(() => p2.validateInDimensions(d)).toThrow();
    expect(() => p3.validateInDimensions(d)).toThrow();
  });

});
