// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { bottomLeft, bottomRight, black, blue, green, grey, midpoint, red, small, smallFourSquares, topLeft,
  topRight } from '../common/Globals';
import { copyShader, fillConstShader, fillUniformShader } from '../common/Shaders';
import { TestImages } from '../common/TestImages';
import { TestPatterns } from '../common/TestPatterns';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimColor, FimDimensions, FimError, FimTextureSampling, FimTransform3D,
  FimTwoTriangles} from '@leosingleton/fim';

/** WebGL tests for FIM */
export function fimTestSuiteWebGL(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM WebGL - ${description}`, () => {

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
        expect(caps.glMaxFragmentUniformVectors).toBeGreaterThanOrEqual(64);
        expect(caps.glMaxVertexUniformVectors).toBeGreaterThanOrEqual(64);
        expect(caps.glExtensions.length).toBeGreaterThan(0);
      });
    });

    it('Executes a simple fill shader with a constant', async () => {
      await usingAsync(factory(small), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillConstShader);
        const image = fim.createImage();

        // Execute the shader
        shader.setConstants({
          cColor: 0.5
        });
        await image.executeAsync(shader);

        // Ensure the output is grey
        expect((await image.getPixelAsync(midpoint(small))).distance(grey)).toBeLessThan(0.05);
      });
    });

    it('Executes a simple fill shader with a uniform', async () => {
      await usingAsync(factory(small), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage();

        // Execute the shader
        shader.setUniforms({
          uColor: [0, 1, 0, 1]
        });
        await image.executeAsync(shader);

        // Ensure the output is green
        expect(await image.getPixelAsync(midpoint(small))).toEqual(green);
      });
    });

    it('Executes a shader with an image parameter', async () => {
      await usingAsync(factory(smallFourSquares), async fim => {
        // Load the four squares sample on to an image
        const srcImage = fim.createImage();
        await srcImage.loadFromPngAsync(TestImages.fourSquaresPng());

        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(copyShader);
        const destImage = fim.createImage();

        // Execute the shader
        shader.setUniform('uInput', srcImage);
        await destImage.executeAsync(shader);

        // Ensure the output is the test pattern
        expect(await destImage.getPixelAsync(topLeft())).toEqual(red);
        expect(await destImage.getPixelAsync(topRight())).toEqual(green);
        expect(await destImage.getPixelAsync(bottomLeft())).toEqual(blue);
        expect(await destImage.getPixelAsync(bottomRight())).toEqual(black);
      });
    });

    it('Executes a shader with many constant values', async () => {
      await usingAsync(factory(small), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillConstShader);
        const image = fim.createImage();

        for (let color = 0; color < 1; color += 0.01) {
          // Execute the shader
          shader.setConstant('cColor', color);
          await image.executeAsync(shader);

          // Ensure the output is the right shade of grey
          const expected = FimColor.fromRGBAFloats(color, color, color, 1);
          expect((await image.getPixelAsync(midpoint(small))).distance(expected)).toBeLessThan(0.05);
        }
      });
    });

    it('Executes a shader with many uniform values', async () => {
      // This test case also tests reusing a shader for many executeAsync() calls
      await usingAsync(factory(small), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage();

        for (let color = 0; color < 1; color += 0.01) {
          // Execute the shader
          shader.setUniform('uColor', [color, color, color, 1]);
          await image.executeAsync(shader);

          // Ensure the output is the right shade of grey
          const expected = FimColor.fromRGBAFloats(color, color, color, 1);
          expect((await image.getPixelAsync(midpoint(small))).distance(expected)).toBeLessThan(0.05);
        }
      });
    });

    it('Executes a copy shader (nearest sampling)', async () => {
      await usingAsync(factory(small), async fim => {
        // Generate an input test pattern
        const input = fim.createImage();
        input.imageOptions.sampling = FimTextureSampling.Nearest;
        await TestPatterns.renderAsync(input, TestPatterns.copyStress);

        // Copy the input to an output image using a WebGL copy shader
        const output = fim.createImage();
        const shader = fim.createGLShader(copyShader);
        shader.setUniform('uInput', input);
        await output.executeAsync(shader);

        // Validate the test pattern matches on the output
        await TestPatterns.validateAsync(output, TestPatterns.copyStress, true);
      });
    });

    it('Executes a copy shader (linear sampling)', async () => {
      await usingAsync(factory(small), async fim => {
        // Generate an input test pattern
        const input = fim.createImage();
        input.imageOptions.sampling = FimTextureSampling.Linear;
        await TestPatterns.renderAsync(input, TestPatterns.copyStress);

        // Copy the input to an output image using a WebGL copy shader
        const output = fim.createImage();
        const shader = fim.createGLShader(copyShader);
        shader.setUniform('uInput', input);
        await output.executeAsync(shader);

        // Validate the test pattern matches on the output
        await TestPatterns.validateAsync(output, TestPatterns.copyStress, true);
      });
    });

    it('Executes a shader with vertex positions and texture coords', async () => {
      await usingAsync(factory(small), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage();

        // Execute the shader
        shader.setUniforms({
          uColor: [1, 0, 0, 1]
        });
        shader.setVertices(FimTwoTriangles.vertexPositions, FimTwoTriangles.textureCoords);
        await image.executeAsync(shader);

        // Ensure the output is red
        expect(await image.getPixelAsync(midpoint(small))).toEqual(red);
      });
    });

    it('Executes a shader with a vertex matrix', async () => {
      await usingAsync(factory(small), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage();

        // Execute the shader
        shader.setUniforms({
          uColor: [0, 0, 1, 1]
        });
        shader.applyVertexMatrix(new FimTransform3D());
        await image.executeAsync(shader);

        // Ensure the output is blue
        expect(await image.getPixelAsync(midpoint(small))).toEqual(blue);
      });
    });

    it('Throws on invalid constant name', () => {
      using(factory(small), fim => {
        const shader = fim.createGLShader(fillConstShader);
        expect(() => shader.setConstant('cInvalid', 0.5)).toThrow();
      });
    });

    it('Throws on invalid uniform name', () => {
      using(factory(small), fim => {
        const shader = fim.createGLShader(fillUniformShader);
        expect(() => shader.setUniform('uInvalid', 0.5)).toThrow();
      });
    });

    it('Throws on missing constants', async () => {
      await usingAsync(factory(small), async fim => {
        const shader = fim.createGLShader(fillConstShader);
        const image = fim.createImage();

        // Missing constant cColor
        (await expectErrorAsync(image.executeAsync(shader))).toBeInstanceOf(FimError);
      });
    });

    it('Throws on missing uniforms', async () => {
      await usingAsync(factory(small), async fim => {
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImage();

        // Missing uniform uColor
        (await expectErrorAsync(image.executeAsync(shader))).toBeInstanceOf(FimError);
      });
    });

  });
}
