// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { blue, red, small } from '../common/Globals';
import { Fim, FimDimensions } from '@leosingleton/fim';

/** Create/dispose tests for Fim */
export function fimTestSuiteCreateDispose(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`${description} - Create/Dispose`, () => {

    it('Creates and disposes', () => {
      const client = factory(small);
      client.dispose();

      // Double-dispose throws an exception
      expect(() => client.dispose()).toThrow();
    });

    it('Handles multiple releaseAllResources() calls', () => {
      const client = factory(small);
      client.releaseAllResources();
      client.releaseAllResources();
      client.releaseAllResources();
      client.dispose();
    });

    it('Creates and disposes images', () => {
      const client = factory(small);

      const img1 = client.createImage();
      img1.fillSolid(red);
      img1.dispose();

      const img2 = client.createImage();
      img2.fillSolid(blue);
      img2.dispose();

      client.dispose();
    });

  });
}
