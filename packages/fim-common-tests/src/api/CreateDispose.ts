// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fillConstShader, fillUniformShader } from '../common/Shaders';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimImage, FimShader } from '@leosingleton/fim';

/** Create/dispose tests for FIM */
export function fimTestSuiteCreateDispose(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM Create/Dispose - ${description}`, () => {

    it('Creates and disposes', () => {
      const fim = factory(TestSizes.small);
      fim.dispose();

      // Double-dispose throws an exception
      expect(() => fim.dispose()).toThrow();
    });

    it('Handles multiple releaseAllResources() calls', () => {
      using(factory(TestSizes.small), fim => {
        fim.releaseAllResources();
        fim.releaseAllResources();
        fim.releaseAllResources();
      });
    });

    it('Creates and disposes images', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const img1 = fim.createImage();
        await img1.fillSolidAsync(TestColors.red);
        img1.dispose();

        const img2 = fim.createImage();
        img2.dispose();
      });
    });

    it('Creates and disposes shaders', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const shader1 = fim.createGLShader(fillConstShader);
        shader1.dispose();

        const shader2 = fim.createGLShader(fillUniformShader);
        shader2.dispose();
      });
    });

    it('Parent automatically disposes children', () => {
      let shader: FimShader;
      let image: FimImage;

      using(factory(TestSizes.small), fim => {
        shader = fim.createGLShader(fillConstShader);
        image = fim.createImage();
      });

      // The shader and image are automatically disposed by the parent FIM instance. Calling dispose() again on these
      // objects should throw an exception.
      expect(() => shader.dispose()).toThrow();
      expect(() => image.dispose()).toThrow();
    });

  });
}
