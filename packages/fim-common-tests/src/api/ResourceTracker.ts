// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { smallFourSquares } from '../common/Globals';
import { TestImages } from '../common/TestImages';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';

/** FIM test cases around resource tracking */
export function fimTestSuiteResourceTracker(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM Resource Tracker - ${description}`, () => {

    it('Tracks canvas resources', async () => {
      const fim = factory(smallFourSquares);
      await usingAsync(fim, async fim => {
        const image = fim.createImage();
        const png = TestImages.fourSquaresPng();
        await image.loadFromPngAsync(png);

        // Check summary metrics
        const rm = fim.getResourceMetrics();
        expect(rm.instances).toEqual(1);
        expect(rm.nonGLMemory).toEqual(smallFourSquares.getArea() * 4);
        expect(rm.glMemory).toEqual(0);

        // Check detailed metrics
        const rmd = fim.getResourceMetricsDetailed();
        expect(rmd.canvas2D.instances).toEqual(1);
        expect(rmd.canvas2D.nonGLMemory).toEqual(smallFourSquares.getArea() * 4);
        expect(rmd.canvas2D.glMemory).toEqual(0);
      });

      // All resources are freed by dispose()
      const rm = fim.getResourceMetrics();
      expect(rm.instances).toEqual(0);
      expect(rm.nonGLMemory).toEqual(0);
      expect(rm.glMemory).toEqual(0);
    });

  });
}
