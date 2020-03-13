// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loseContextAsync } from '../common/ContextLost';
import { small } from '../common/Globals';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';
import { EngineFim, EngineImage, EngineShader } from '@leosingleton/fim/internals';

/** WebGL Context Lost tests for Fim */
export function fimTestSuiteWebGLContextLost(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim WebGL Context Lost - ${description}`, () => {

    it('Simulate a context loss', async () => {
      await usingAsync(factory(small), async fim => {
        const engine = fim as EngineFim<EngineImage, EngineShader>;
        const canvas = engine.getWebGLCanvas();

        // Simulate a context loss
        expect(fim.isContextLost()).toBeFalsy();
        await loseContextAsync(canvas);
        expect(fim.isContextLost()).toBeTruthy();
      });
    });

  });
}
