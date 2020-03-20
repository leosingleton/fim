// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { small, medium } from '../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';

/** Oversized for Fim */
export function fimTestSuiteOversized(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim Oversized - ${description}`, () => {

    it('Downsizes images larger than parent FIM', () => {
      using(factory(small), fim => {
        const image = fim.createImage({}, medium);
        const eff = image.getEffectiveImageOptions();
        expect(eff.downscale).toEqual(50 / 640);
      });
    });

  });
}
