// src/fim/Point.spec.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>

import { FimPoint } from '../FimPoint';
import { FimRect } from '../FimRect';

describe("FimPoint", () => {

  it("generates random points within a rectangle", () => {
    let rect = FimRect.fromCoordinates(200, 400, 600, 1000);
    let points = FimPoint.getRandomPoints(100, rect);
    for (let n = 0; n < 100; n++) {
      let point = points[n];
      expect(point.x).toBeGreaterThanOrEqual(rect.xLeft);
      expect(point.x).toBeLessThan(rect.xRight);
      expect(point.y).toBeGreaterThanOrEqual(rect.yTop);
      expect(point.y).toBeLessThan(rect.yBottom);
    }
  });

  it("caches results", () => {
    let rect = FimRect.fromCoordinates(100, 200, 300, 500);
    let points1 = FimPoint.getRandomPoints(200, rect);
    let points2 = FimPoint.getRandomPoints(100, rect); // Intentionally smaller than previous call
    for (let n = 0; n < 100; n++) {
      expect(points1[n]).toEqual(points2[n]);
    }
  });
  
});
