// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loseContextAsync, restoreContextAsync } from '../common/ContextLost';
import { small } from '../common/Globals';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';
import { EngineFim, EngineImage, EngineShader } from '@leosingleton/fim/internals';

/**
 * Forces a WebGL context loss for test purposes
 * @param fim FIM instance
 */
function loseFimContextAsync(fim: Fim): Promise<void> {
  // Typecast to an internal engine object to get access to the CoreCanvasWebGL instance
  const engine = fim as EngineFim<EngineImage, EngineShader>;
  const canvas = engine.getWebGLCanvas();

  return loseContextAsync(canvas);
}

/**
 * Forces the WebGL context to be restored for test purposes
 * @param fim FIM instance
 */
function restoreFimContextAsync(fim: Fim): Promise<void> {
  // Typecast to an internal engine object to get access to the CoreCanvasWebGL instance
  const engine = fim as EngineFim<EngineImage, EngineShader>;
  const canvas = engine.getWebGLCanvas();

  return restoreContextAsync(canvas);
}

/** WebGL Context Lost tests for Fim */
export function fimTestSuiteWebGLContextLost(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim WebGL Context Lost - ${description}`, () => {

    it('Simulate a context loss', async () => {
      await usingAsync(factory(small), async fim => {
        expect(fim.isContextLost()).toBeFalsy();
        await loseFimContextAsync(fim);
        expect(fim.isContextLost()).toBeTruthy();
      });
    });

    it('Simulate a context loss and restore', async () => {
      await usingAsync(factory(small), async fim => {
        expect(fim.isContextLost()).toBeFalsy();
        await loseFimContextAsync(fim);
        expect(fim.isContextLost()).toBeTruthy();
        await restoreFimContextAsync(fim);
        expect(fim.isContextLost()).toBeFalsy();
      });
    });

  });
}
