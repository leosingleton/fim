// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { bottomLeft, bottomRight, black, blue, green, grey, midpoint, red, small, smallFourSquares, topLeft,
  topRight } from '../common/Globals';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimColor } from '@leosingleton/fim';
import { TestImages } from '../common/TestImages';

/** Sample WebGL shader to copy a texture to the output */
const copyShader = require('../glsl/Copy.glsl.js');

/** Sample WebGL shader to fill with a solid shade of grey specified by a constant */
const fillConstShader = require('../glsl/FillConst.glsl.js');

/** Sample WebGL shader to fill with a solid color specified by a constant */
const fillUniformShader = require('../glsl/FillUniform.glsl.js');

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
          shader.setConstants({
            cColor: color
          });
          await image.executeAsync(shader);

          // Ensure the output is the right shade of grey
          const expected = FimColor.fromRGBAFloats(color, color, color, 1);
          expect((await image.getPixelAsync(midpoint(small))).distance(expected)).toBeLessThan(0.05);
        }
      });
    });

  });
}
