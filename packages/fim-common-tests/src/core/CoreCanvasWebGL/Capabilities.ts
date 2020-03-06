// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { small } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimBitsPerPixel, FimDimensions, FimTextureSampling } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for capabilities */
export function coreCanvasWebGLTestSuiteCapabilities(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Capabilities - ${description}`, () => {

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

    it('Detects capabilities', () => {
      using(factory(small), canvas => {
        const caps = canvas.detectCapabilities();
        expect(caps.glMaxRenderBufferSize).toBeGreaterThan(0);
        expect(caps.glMaxTextureImageUnits).toBeGreaterThan(0);
        expect(caps.glMaxTextureSize).toBeGreaterThan(0);
      });
    });

  });
}
