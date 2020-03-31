// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestSizes } from '../common/TestSizes';
import { using } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';
import { defaultImageOptions } from '@leosingleton/fim/internals';

/** Image tests for FIM */
export function fimTestSuiteImage(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM Image - ${description}`, () => {

    it('Computes effective image options', () => {
      using(factory(TestSizes.small), fim => {
        const image = fim.createImage();
        const options = image.getEffectiveImageOptions();
        expect(options.allowOversized).toEqual(defaultImageOptions.allowOversized);
        expect(options.backup).toEqual(defaultImageOptions.backup);
        // Skip BPP. It varies based on the GPU and WebGL capabilities.
        expect(options.downscale).toEqual(defaultImageOptions.downscale);
        expect(options.fillColorOnContextLost).toEqual(defaultImageOptions.fillColorOnContextLost);
        expect(options.glDownscale).toEqual(defaultImageOptions.glDownscale);
        expect(options.glReadOnly).toEqual(defaultImageOptions.glReadOnly);
        expect(options.sampling).toEqual(defaultImageOptions.sampling);
      });
    });

  });
}
