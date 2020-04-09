// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { midpoint } from '../common/Globals';
import { copyShader, fillConstShader, fillUniformShader } from '../common/Shaders';
import { TestColors } from '../common/TestColors';
import { TestImages } from '../common/TestImages';
import { TestPatterns } from '../common/TestPatterns';
import { TestSizes } from '../common/TestSizes';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimColor, FimError, FimTextureSampling } from '@leosingleton/fim';

/** WebGL tests for FIM */
export function fimTestSuiteWebGL(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM WebGL - ${description}`, () => {

    it('Detects WebGL capabilities', () => {
      using(factory(), fim => {
        const caps = fim.capabilities;
        expect(caps.glVersion.length).toBeGreaterThan(0);
        expect(caps.glShadingLanguageVersion.length).toBeGreaterThan(0);
        expect(caps.glVendor.length).toBeGreaterThan(0);
        expect(caps.glRenderer.length).toBeGreaterThan(0);
        // Skip glUnmaskedVendor and glUnmaskedRenderer because they are sometimes empty strings
        expect(caps.glMaxRenderBufferSize).toBeGreaterThanOrEqual(1024);
        expect(caps.glMaxTextureImageUnits).toBeGreaterThanOrEqual(4);
        expect(caps.glMaxTextureSize).toBeGreaterThanOrEqual(1024);
        expect(caps.glMaxFragmentUniformVectors).toBeGreaterThanOrEqual(64);
        expect(caps.glMaxVertexUniformVectors).toBeGreaterThanOrEqual(64);
        expect(caps.glExtensions.length).toBeGreaterThan(0);
      });
    });

    it('Executes a simple fill shader with a constant', async () => {
      await usingAsync(factory(), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillConstShader);
        const image = fim.createImage(TestSizes.smallWide);

        // Execute the shader
        shader.setConstants({
          cColor: 0.5
        });
        await image.executeAsync(shader);

        // Ensure the output is grey
        expect((await image.getPixelAsync(midpoint(TestSizes.smallWide))).distance(TestColors.grey))
          .toBeLessThan(0.05);
      });
    });

    it('Executes a simple fill shader with a uniform', async () => {
      await usingAsync(factory(), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage(TestSizes.smallWide);

        // Execute the shader
        shader.setUniforms({
          uColor: [0, 1, 0, 1]
        });
        await image.executeAsync(shader);

        // Ensure the output is green
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);
      });
    });

    it('Executes a shader with an image parameter', async () => {
      await usingAsync(factory(), async fim => {
        // Load the four squares sample on to an image
        const srcImage = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());

        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(copyShader);
        const destImage = fim.createImage(TestSizes.smallSquare);

        // Execute the shader
        shader.setUniform('uInput', srcImage);
        await destImage.executeAsync(shader);

        // Ensure the output is the test pattern
        await TestImages.expectFourSquaresPngAsync(destImage);
      });
    });

    it('Executes a shader with many constant values', async () => {
      await usingAsync(factory(), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillConstShader);
        const image = fim.createImage(TestSizes.smallWide);

        for (let color = 0; color < 1; color += 0.01) {
          // Execute the shader
          shader.setConstant('cColor', color);
          await image.executeAsync(shader);

          // Ensure the output is the right shade of grey
          const expected = FimColor.fromRGBAFloats(color, color, color, 1);
          expect((await image.getPixelAsync(midpoint(TestSizes.smallWide))).distance(expected)).toBeLessThan(0.05);
        }
      });
    });

    it('Executes a shader with many uniform values', async () => {
      // This test case also tests reusing a shader for many executeAsync() calls
      await usingAsync(factory(), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage(TestSizes.smallWide);

        for (let color = 0; color < 1; color += 0.01) {
          // Execute the shader
          shader.setUniform('uColor', [color, color, color, 1]);
          await image.executeAsync(shader);

          // Ensure the output is the right shade of grey
          const expected = FimColor.fromRGBAFloats(color, color, color, 1);
          expect((await image.getPixelAsync(midpoint(TestSizes.smallWide))).distance(expected)).toBeLessThan(0.05);
        }
      });
    });

    it('Executes a copy shader (nearest sampling)', async () => {
      await usingAsync(factory(), async fim => {
        // Generate an input test pattern
        const input = fim.createImage(TestSizes.smallWide);
        input.imageOptions.sampling = FimTextureSampling.Nearest;
        await TestPatterns.renderAsync(input, TestPatterns.copyStress);

        // Copy the input to an output image using a WebGL copy shader
        const output = fim.createImage(TestSizes.smallWide);
        const shader = fim.createGLShader(copyShader);
        shader.setUniform('uInput', input);
        await output.executeAsync(shader);

        // Validate the test pattern matches on the output
        await TestPatterns.validateAsync(output, TestPatterns.copyStress, true);
      });
    });

    it('Executes a copy shader (linear sampling)', async () => {
      await usingAsync(factory(), async fim => {
        // Generate an input test pattern
        const input = fim.createImage(TestSizes.smallWide);
        input.imageOptions.sampling = FimTextureSampling.Linear;
        await TestPatterns.renderAsync(input, TestPatterns.copyStress);

        // Copy the input to an output image using a WebGL copy shader
        const output = fim.createImage(TestSizes.smallWide);
        const shader = fim.createGLShader(copyShader);
        shader.setUniform('uInput', input);
        await output.executeAsync(shader);

        // Validate the test pattern matches on the output
        await TestPatterns.validateAsync(output, TestPatterns.copyStress, true);
      });
    });

    it('Throws on invalid constant name', () => {
      using(factory(), fim => {
        const shader = fim.createGLShader(fillConstShader);
        expect(() => shader.setConstant('cInvalid', 0.5)).toThrow();
      });
    });

    it('Throws on invalid uniform name', () => {
      using(factory(), fim => {
        const shader = fim.createGLShader(fillUniformShader);
        expect(() => shader.setUniform('uInvalid', 0.5)).toThrow();
      });
    });

    it('Throws on missing constants', async () => {
      await usingAsync(factory(), async fim => {
        const shader = fim.createGLShader(fillConstShader);
        const image = fim.createImage(TestSizes.smallWide);

        // Missing constant cColor
        (await expectErrorAsync(image.executeAsync(shader))).toBeInstanceOf(FimError);
      });
    });

    it('Throws on missing uniforms', async () => {
      await usingAsync(factory(), async fim => {
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage(TestSizes.smallWide);

        // Missing uniform uColor
        (await expectErrorAsync(image.executeAsync(shader))).toBeInstanceOf(FimError);
      });
    });

    it('Allows a shader to be explicitly compiled', async () => {
      await usingAsync(factory(), async fim => {
        // Create a shader and explicitly compile it
        const shader = fim.createGLShader(fillUniformShader);
        await shader.compileAsync();

        // Now, create an image and use the shader. Doing so will create a new WebGL canvas and cause the shader to get
        // recompiled.
        shader.setUniform('uColor', TestColors.red.toVector());
        const image = fim.createImage(TestSizes.smallWide);
        await image.executeAsync(shader);
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);

        // Call compile again. This is a no-op as the compiled version is cached.
        await shader.compileAsync();
      });
    });

  });
}
