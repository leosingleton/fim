// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { red, small } from '../common/Globals';
import { using, usingAsync } from '@leosingleton/commonlibs';
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

    it('Creates and disposes images', async () => {
      await usingAsync(factory(small), async fim => {
        const img1 = fim.createImage();
        await img1.fillSolidAsync(red);
        img1.dispose();

        const img2 = fim.createImage();
        img2.dispose();
      });
    });

    it('Creates and disposes shaders', async () => {
      await usingAsync(factory(small), async fim => {
        const fillConstShader = require('../glsl/FillConst.glsl.js');
        const shader1 = fim.createGLShader(fillConstShader);
        shader1.dispose();

        const fillUniformShader = require('../glsl/FillUniform.glsl.js');
        const shader2 = fim.createGLShader(fillUniformShader);
        shader2.dispose();
      });
    });

  });
}
