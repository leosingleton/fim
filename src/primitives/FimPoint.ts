// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimRect } from './FimRect';
import { SeededRandom } from '@leosingleton/commonlibs';

/** Simple class for holding a pair of coordinates */
export class FimPoint {
  public readonly x: number;
  public readonly y: number;

  public constructor(x: number, y: number) {
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
    const dimensions = `${rect.xLeft}.${rect.xRight}.${rect.yTop}.${rect.yBottom}`;
    let pointArray = FimPoint.randomPointCache[dimensions];

    if (!pointArray || pointArray.length < samples) {
      pointArray = [];

      // We use a seeded random number generator so the same pixels are selected from frame to frame. This yields more
      // consistent comparisons between frames than truly random.
      const rng = new SeededRandom(0);

      const w = rect.w;
      const h = rect.h;

      for (let n = 0; n < samples; n++) {
        const x = Math.floor(rng.nextFloat() * w) + rect.xLeft;
        const y = Math.floor(rng.nextFloat() * h) + rect.yTop;
        pointArray.push(new FimPoint(x, y));
      }

      // Cache the result for future calls
      FimPoint.randomPointCache[dimensions] = pointArray;
    }

    return pointArray;
  }

  private static randomPointCache: { [dimensions: string]: FimPoint[] } = {};
}
