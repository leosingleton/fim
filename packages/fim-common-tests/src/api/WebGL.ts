// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { small } from '../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';

/** WebGL tests for Fim */
export function fimTestSuiteWebGL(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim WebGL - ${description}`, () => {

    it('Detects WebGL capabilities', () => {
      using(factory(small), fim => {
        const caps = fim.capabilities;
        expect(caps.glVersion.length).toBeGreaterThan(0);
        expect(caps.glShadingLanguageVersion.length).toBeGreaterThan(0);
        expect(caps.glVendor.length).toBeGreaterThan(0);
        expect(caps.glRenderer.length).toBeGreaterThan(0);
        // Skip glUnmaskedVendor and glUnmaskedRenderer because they are sometimes empty strings
        expect(caps.glMaxRenderBufferSize).toBeGreaterThanOrEqual(1024);
        expect(caps.glMaxTextureImageUnits).toBeGreaterThanOrEqual(4);
        expect(caps.glMaxTextureSize).toBeGreaterThanOrEqual(1024);
        expect(caps.glExtensions.length).toBeGreaterThan(0);
      });
    });

  });
}
