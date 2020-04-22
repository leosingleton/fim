// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestSizes } from '../common/TestSizes';
import { using } from '@leosingleton/commonlibs';
import { Fim } from '@leosingleton/fim';
import { defaultImageOptions } from '@leosingleton/fim/internals';

/** Image tests for FIM */
export function fimTestSuiteImage(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM Image - ${description}`, () => {

    it('Computes effective image options', () => {
      using(factory(), fim => {
        const image = fim.createImage(TestSizes.smallWide);
        const options = image.getEffectiveImageOptions();
        expect(options.autoBackup).toEqual(defaultImageOptions.autoBackup);
        // Skip BPP. It varies based on the GPU and WebGL capabilities.
        expect(options.downscale).toEqual(defaultImageOptions.downscale);
        expect(options.defaultFillColor).toEqual(defaultImageOptions.defaultFillColor);
        expect(options.glDownscale).toEqual(defaultImageOptions.glDownscale);
        expect(options.oversizedReadOnly).toEqual(defaultImageOptions.oversizedReadOnly);
        expect(options.sampling).toEqual(defaultImageOptions.sampling);
      });
    });

  });
}
