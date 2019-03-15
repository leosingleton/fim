// src/fim/Point.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>

import { FimRect } from './FimRect';
import { SeededRandom } from '@leosingleton/commonlibs';

/** Simple class for holding a pair of coordinates */
export class FimPoint {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Returns an array of semi-random pixel coordinates on the current canvas
   * @param samples Number of coordinates to return. Note this is the _minimum_ size of the result, and the actual
   *    returned array may be larger than requested.
   * @param rect Rectangle containing the boundary of pixels to select from.
   */
  public static getRandomPoints(samples: number, rect: FimRect): FimPoint[] {
    // Since we're reading the same pixels over and over, there's no point in recalculating random values each time.
    // Cache them, since the coordinates will be the same for all canvases of the same dimensions.
    let dimensions = rect.xLeft + '.' + rect.xRight + '.' + rect.yTop + '.' + rect.yBottom;
    let pointArray = FimPoint.randomPointCache[dimensions];

    if (!pointArray || pointArray.length < samples) {
      pointArray = [];

      // We use a seeded random number generator so the same pixels are selected from frame to frame. This yields more
      // consistent comparisons between frames than truly random.
      let rng = new SeededRandom(0);

      let w = rect.w;
      let h = rect.h;

      for (let n = 0; n < samples; n++) {
        let x = Math.floor(rng.nextFloat() * w) + rect.xLeft;
        let y = Math.floor(rng.nextFloat() * h) + rect.yTop;
        pointArray.push(new FimPoint(x, y));
      }

      // Cache the result for future calls
      FimPoint.randomPointCache[dimensions] = pointArray;
    }

    return pointArray;
  }

  private static randomPointCache: { [dimensions: string]: FimPoint[] } = {};
}
