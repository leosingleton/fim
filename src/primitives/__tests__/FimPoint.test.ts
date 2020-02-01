// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimPoint } from '../FimPoint';
import { FimRect } from '../FimRect';

describe('FimPoint', () => {

  it('Generates random points within a rectangle', () => {
    const rect = FimRect.fromCoordinates(200, 400, 600, 1000);
    const points = FimPoint.getRandomPoints(100, rect);
    for (let n = 0; n < 100; n++) {
      const point = points[n];
      expect(point.x).toBeGreaterThanOrEqual(rect.xLeft);
      expect(point.x).toBeLessThan(rect.xRight);
      expect(point.y).toBeGreaterThanOrEqual(rect.yTop);
      expect(point.y).toBeLessThan(rect.yBottom);
    }
  });

  it('Caches results', () => {
    const rect = FimRect.fromCoordinates(100, 200, 300, 500);
    const points1 = FimPoint.getRandomPoints(200, rect);
    const points2 = FimPoint.getRandomPoints(100, rect); // Intentionally smaller than previous call
    for (let n = 0; n < 100; n++) {
      expect(points1[n]).toEqual(points2[n]);
    }
  });

});
