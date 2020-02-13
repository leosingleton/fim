// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimPoint } from '../FimPoint';
import { FimRect } from '../FimRect';

function validate1234(rect: FimRect): void {
  expect(rect.xLeft).toEqual(100);
  expect(rect.yTop).toEqual(200);
  expect(rect.dim.w).toEqual(300);
  expect(rect.dim.h).toEqual(400);
  expect(rect.xRight).toEqual(400);
  expect(rect.yBottom).toEqual(600);
}

describe('FimRect', () => {

  it('Constructs from x/y/width/height', () => {
    validate1234(FimRect.fromXYWidthHeight(100, 200, 300, 400));
  });

  it('Constructs from point/width/height', () => {
    validate1234(FimRect.fromPointWidthHeight(FimPoint.fromXY(100, 200), 300, 400));
  });

  it('Constructs from coordinates', () => {
    validate1234(FimRect.fromCoordinates(100, 200, 400, 600));
  });

  it('Constructs from points', () => {
    validate1234(FimRect.fromPoints(FimPoint.fromXY(100, 200), FimPoint.fromXY(400, 600)));
  });

  it('equals', () => {
    const rect1 = FimRect.fromXYWidthHeight(100, 200, 300, 400);
    const rect2 = FimRect.fromXYWidthHeight(100, 200, 300, 400);
    const rect3 = FimRect.fromXYWidthHeight(100, 200, 400, 300);
    expect(rect1.equals(rect2)).toBeTruthy();
    expect(rect2.equals(rect1)).toBeTruthy();
    expect(rect1.equals(rect3)).toBeFalsy();
    expect(rect3.equals(rect2)).toBeFalsy();
  });

  it('Compares sameDimensions', () => {
    const rect1 = FimRect.fromXYWidthHeight(100, 200, 300, 400);
    const rect2 = FimRect.fromXYWidthHeight(200, 300, 300, 400);
    const rect3 = FimRect.fromXYWidthHeight(100, 200, 400, 300);
    expect(rect1.sameDimensions(rect2)).toBeTruthy();
    expect(rect2.sameDimensions(rect1)).toBeTruthy();
    expect(rect1.sameDimensions(rect3)).toBeFalsy();
    expect(rect3.sameDimensions(rect2)).toBeFalsy();
  });

  it('Converts upright', () => {
    const rect = FimRect.fromPoints(FimPoint.fromXY(400, 600), FimPoint.fromXY(100, 200));
    validate1234(rect.toUpright());
  });

  it('Calculates the center point', () => {
    const rect = FimRect.fromXYWidthHeight(100, 100, 300, 200);
    const center = rect.getCenter();
    expect(center.x).toBe(250);
    expect(center.y).toBe(200);
  });

  it('Calculates area', () => {
    const rect1 = FimRect.fromXYWidthHeight(100, 200, 300, 400);
    expect(rect1.getArea()).toEqual(120000);

    const rect2 = FimRect.fromXYWidthHeight(200, 300, 30, 40);
    expect(rect2.getArea()).toEqual(1200);
  });

  it('Prevents negative widths', () => {
    const rect = FimRect.fromCoordinates(200, 50, 100, 150);
    expect(rect).toEqual(FimRect.fromCoordinates(100, 50, 200, 150));
  });

  it('Prevents negative heights', () => {
    const rect = FimRect.fromCoordinates(100, 150, 200, 50);
    expect(rect).toEqual(FimRect.fromCoordinates(100, 50, 200, 150));
  });

  it('Fits one rectangle inside another', () => {
    const innerRect = FimRect.fromXYWidthHeight(0, 0, 100, 100);
    const outerRect = FimRect.fromXYWidthHeight(200, 200, 200, 50);
    expect(innerRect.fit(outerRect)).toEqual(FimRect.fromXYWidthHeight(200, 200, 50, 50));
  });

  it('Tests whether it contains a point', () => {
    const outerRect = FimRect.fromXYWidthHeight(200, 200, 200, 50);
    const point1 = FimPoint.fromXY(300, 249);
    const point2 = FimPoint.fromXY(300, 250);
    expect(outerRect.containsPoint(point1)).toBeTruthy();
    expect(outerRect.containsPoint(point2)).toBeFalsy();
  });

  it('Tests whether it contains another rectangle', () => {
    const outerRect = FimRect.fromXYWidthHeight(200, 200, 200, 50);
    const innerRect1 = FimRect.fromXYWidthHeight(300, 200, 50, 50);
    const innerRect2 = FimRect.fromXYWidthHeight(0, 0, 100, 100);
    expect(outerRect.containsRect(innerRect1)).toBeTruthy();
    expect(outerRect.containsRect(innerRect2)).toBeFalsy();
    expect(outerRect.containsRect(outerRect)).toBeTruthy();
    expect(innerRect1.containsRect(innerRect1)).toBeTruthy();
    expect(innerRect2.containsRect(innerRect2)).toBeTruthy();
  });

  it('Calculates floor', () => {
    const rect = FimRect.fromCoordinates(2.5, 3.5, 5.9, 6);
    expect(rect.toFloor()).toEqual(FimRect.fromCoordinates(2, 3, 5, 6));
  });

});
