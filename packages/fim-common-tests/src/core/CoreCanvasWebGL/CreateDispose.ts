// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { small } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimBitsPerPixel, FimDimensions, FimImageOptions, FimTextureSampling } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/build/internal';

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

    it('Calculates max texture depth', () => {
      using(factory(small), canvas => {
        const options: FimImageOptions = {
          bpp: FimBitsPerPixel.BPP32,
          sampling: FimTextureSampling.Linear
        };
        const bpp = canvas.getMaxTextureDepth(options);
        expect(bpp).toBeGreaterThanOrEqual(FimBitsPerPixel.BPP8);
      });
    });

    it('Calculates max texture depth when limited to 8 BPP', () => {
      using(factory(small), canvas => {
        const options: FimImageOptions = {
          bpp: FimBitsPerPixel.BPP8,
          sampling: FimTextureSampling.Nearest
        };
        const bpp = canvas.getMaxTextureDepth(options);
        expect(bpp).toEqual(FimBitsPerPixel.BPP8);
      });
    });

  });
}
