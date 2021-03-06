// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { midpoint } from '../common/Globals';
import { fillUniformShader } from '../common/Shaders';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync, Task } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';
import { EngineFim } from '@leosingleton/fim/internals';

const onePixel = FimDimensions.fromSquareDimension(1);

/**
 * Forces a WebGL context loss for test purposes
 * @param fim FIM instance
 */
async function loseFimContextAsync(fim: Fim): Promise<void> {
  // Typecast to an internal engine object to get access to the CoreCanvasWebGL instance
  const engine = fim as EngineFim;
  const canvas = await engine.allocateWebGLCanvasAsync(onePixel);

  return canvas.loseContextAsync();
}

/**
 * Forces the WebGL context to be restored for test purposes
 * @param fim FIM instance
 */
async function restoreFimContextAsync(fim: Fim): Promise<void> {
  // Typecast to an internal engine object to get access to the CoreCanvasWebGL instance
  const engine = fim as EngineFim;
  const canvas = await engine.allocateWebGLCanvasAsync(onePixel);

  return canvas.restoreContextAsync();
}

/** WebGL Context Lost tests for FIM */
export function fimTestSuiteWebGLContextLost(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM WebGL Context Lost - ${description}`, () => {

    it('Simulate a context loss', async () => {
      await usingAsync(factory(), async fim => {
        expect(fim.isContextLost()).toBeFalsy();
        await loseFimContextAsync(fim);
        expect(fim.isContextLost()).toBeTruthy();
      });
    });

    it('Simulate a context loss and restore', async () => {
      await usingAsync(factory(), async fim => {
        expect(fim.isContextLost()).toBeFalsy();
        await loseFimContextAsync(fim);
        expect(fim.isContextLost()).toBeTruthy();
        await restoreFimContextAsync(fim);
        expect(fim.isContextLost()).toBeFalsy();
      });
    });

    it('Allows handlers to be registered', async () => {
      await usingAsync(factory(), async fim => {
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
      await usingAsync(factory(), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage(TestSizes.smallWide);
        expect(image.hasImage()).toBeFalsy();

        // Execute the shader to fill the destination texture with red
        shader.setUniform('uColor', TestColors.red.toVector());
        await image.executeAsync(shader);
        expect(image.hasImage()).toBeTruthy();

        // Simulate context loss and restore
        await loseFimContextAsync(fim);
        await restoreFimContextAsync(fim);
        expect(image.hasImage()).toBeFalsy();

        // Execute the shader to fill the destination texture with green
        shader.setUniform('uColor', TestColors.green.toVector());
        await image.executeAsync(shader);
        expect(image.hasImage()).toBeTruthy();

        // Ensure the texture is green
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);
      });
    });

    it('defaultFillColor works on context loss', async () => {
      await usingAsync(factory(), async fim => {
        fim.defaultImageOptions.defaultFillColor = TestColors.blue;

        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage(TestSizes.smallWide);
        expect(image.hasImage()).toBeFalsy();

        // Execute the shader to fill the destination texture with red
        shader.setUniform('uColor', TestColors.red.toVector());
        await image.executeAsync(shader);
        expect(image.hasImage()).toBeTruthy();

        // Simulate context loss and restore
        await loseFimContextAsync(fim);
        await restoreFimContextAsync(fim);

        // Because defaultFillColor was set, the image should be blue as soon as we read it
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.blue);
        expect(image.hasImage()).toBeTruthy();
      });
    });

    it('Runs context loss simulation', async () => {
      await usingAsync(factory(), async fim => {
        // Create an image and fill it using defaultFillColor
        const image = fim.createImage(TestSizes.smallTall);
        fim.defaultImageOptions.defaultFillColor = TestColors.magenta;
        expect(await image.getPixelAsync(midpoint(TestSizes.smallTall))).toEqual(TestColors.magenta);

        // Enable the context loss simulation for a few seconds
        fim.enableContextLossSimulation(500, 0);
        await Task.delayAsync(2000);
        fim.disableContextLossSimulation();
        await Task.delayAsync(1000);

        // The image should still be magenta
        expect(await image.getPixelAsync(midpoint(TestSizes.smallTall))).toEqual(TestColors.magenta);
      });
    });

  });
}
