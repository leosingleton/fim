// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { blue, red, small } from '../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';

/** Create/dispose tests for Fim */
export function fimTestSuiteCreateDispose(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim Create/Dispose - ${description}`, () => {

    it('Creates and disposes', () => {
      const fim = factory(small);
      fim.dispose();

      // Double-dispose throws an exception
      expect(() => fim.dispose()).toThrow();
    });

    it('Handles multiple releaseAllResources() calls', () => {
      using(factory(small), fim => {
        fim.releaseAllResources();
        fim.releaseAllResources();
        fim.releaseAllResources();
      });
    });

    it('Creates and disposes images', () => {
      using(factory(small), fim => {
        const img1 = fim.createImage();
        img1.fillSolid(red);
        img1.dispose();

        const img2 = fim.createImage();
        img2.fillSolid(blue);
        img2.dispose();
      });
    });

  });
}
