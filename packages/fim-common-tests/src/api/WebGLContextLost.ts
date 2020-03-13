// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loseContextAsync, restoreContextAsync } from '../common/ContextLost';
import { blue, green, midpoint, small } from '../common/Globals';
import { fillUniformShader } from '../common/Shaders';
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

    it('Allows handlers to be registered', async () => {
      await usingAsync(factory(small), async fim => {
        let isLost = 0, isRestored = 0;

        fim.registerContextLostHandler(() => {
          isLost++;
        });

        fim.registerContextRestoredHandler(() => {
          isRestored++;
        });

        expect(isLost).toEqual(0);
        expect(isRestored).toEqual(0);

        await loseFimContextAsync(fim);

        expect(isLost).toEqual(1);
        expect(isRestored).toEqual(0);

        await restoreFimContextAsync(fim);

        expect(isLost).toEqual(1);
        expect(isRestored).toEqual(1);
      });
    });

    it('Shaders automatically recover from context loss', async () => {
      await usingAsync(factory(small), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage();
        expect(image.hasImage()).toBeFalsy();

        // Execute the shader to fill the destination texture with red
        shader.setUniform('uColor', [1, 0, 0, 1]);
        await image.executeAsync(shader);
        expect(image.hasImage()).toBeTruthy();

        // Simulate context loss and restore
        await loseFimContextAsync(fim);
        await restoreFimContextAsync(fim);
        expect(image.hasImage()).toBeFalsy();

        // Execute the shader to fill the destination texture with green
        shader.setUniform('uColor', [0, 1, 0, 1]);
        await image.executeAsync(shader);
        expect(image.hasImage()).toBeTruthy();

        // Ensure the texture is green
        expect(await image.getPixelAsync(midpoint(small))).toEqual(green);
      });
    });

    it('fillColorOnContextLost works', async () => {
      await usingAsync(factory(small), async fim => {
        fim.defaultImageOptions.fillColorOnContextLost = blue;

        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage();
        expect(image.hasImage()).toBeFalsy();

        // Execute the shader to fill the destination texture with red
        shader.setUniform('uColor', [1, 0, 0, 1]);
        await image.executeAsync(shader);
        expect(image.hasImage()).toBeTruthy();

        // Simulate context loss and restore
        await loseFimContextAsync(fim);
        await restoreFimContextAsync(fim);

        // Because fillColorOnContextLost was set, the image should now be blue
        expect(image.hasImage()).toBeTruthy();
        expect(await image.getPixelAsync(midpoint(small))).toEqual(blue);
      });
    });

  });
}
