// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { large, small } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimBitsPerPixel, FimDimensions, FimTextureSampling } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for create/dispose */
export function coreCanvasWebGLTestSuiteCreateDispose(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Create/Dispose - ${description}`, () => {

    it('Creates and disposes', () => {
      const canvas = factory(small);
      canvas.dispose();
    });

    it('Calculates max texture depth with linear filtering', () => {
      using(factory(small), canvas => {
        const bpp = canvas.getSupportedColorDepths(FimTextureSampling.Linear);
        expect(bpp).toContain(FimBitsPerPixel.BPP8);
      });
    });

    it('Calculates max texture depth with nearest filtering', () => {
      using(factory(small), canvas => {
        const bpp = canvas.getSupportedColorDepths(FimTextureSampling.Nearest);
        expect(bpp).toContain(FimBitsPerPixel.BPP8);
      });
    });

    xit('Create/dispose stress', () => {
      for (let n = 0; n < 100; n++) {
        using(factory(large), canvas => {
          canvas.createCoreTexture();
        });
      }
    });

  });
}
