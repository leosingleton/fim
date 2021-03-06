// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fillConstShader, fillUniformShader } from '../common/Shaders';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimImage, FimShader } from '@leosingleton/fim';

/** Create/dispose tests for FIM */
export function fimTestSuiteCreateDispose(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM Create/Dispose - ${description}`, () => {

    it('Creates and disposes', () => {
      const fim = factory();
      fim.dispose();

      // Double-dispose throws an exception
      expect(() => fim.dispose()).toThrow();
    });

    it('Handles multiple releaseAllResources() calls', () => {
      using(factory(), fim => {
        fim.releaseAllResources();
        fim.releaseAllResources();
        fim.releaseAllResources();
      });
    });

    it('Creates and disposes images', async () => {
      await usingAsync(factory(), async fim => {
        const img1 = fim.createImage(TestSizes.smallWide, { defaultFillColor: TestColors.red });
        img1.dispose();

        const img2 = fim.createImage(TestSizes.smallWide);
        img2.dispose();
      });
    });

    it('Creates and disposes shaders', async () => {
      await usingAsync(factory(), async fim => {
        const shader1 = fim.createGLShader(fillConstShader);
        shader1.dispose();

        const shader2 = fim.createGLShader(fillUniformShader);
        shader2.dispose();
      });
    });

    it('Parent automatically disposes children', () => {
      let shader: FimShader;
      let image: FimImage;

      using(factory(), fim => {
        shader = fim.createGLShader(fillConstShader);
        image = fim.createImage(TestSizes.smallWide);
      });

      // The shader and image are automatically disposed by the parent FIM instance. Calling dispose() again on these
      // objects should throw an exception.
      expect(() => shader.dispose()).toThrow();
      expect(() => image.dispose()).toThrow();
    });

    it('Detects capabilities', () => {
      using(factory(), fim => {
        const caps = fim.capabilities;
        expect(caps.userAgentString).toBeDefined();
        expect(caps.logicalCpuCount).toBeGreaterThan(0);
        expect(caps.estimatedMemory).toBeGreaterThan(0);
      });
    });

  });
}
