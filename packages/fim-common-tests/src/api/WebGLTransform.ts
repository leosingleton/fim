// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { bottomLeft, bottomRight, midpoint, topLeft, topRight } from '../common/Globals';
import { fillUniformShader } from '../common/Shaders';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimOpCopy, FimTransform2D, FimTransform3D, FimTwoTriangles } from '@leosingleton/fim';

/** WebGL tests for FIM with vertex transformation*/
export function fimTestSuiteWebGLTransform(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM WebGL Transform - ${description}`, () => {

    it('Executes a shader with vertex positions and texture coords', async () => {
      await usingAsync(factory(), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImageWithFill(TestSizes.smallWide, TestColors.black);

        // Execute the shader
        shader.setUniforms({
          uColor: TestColors.red.toVector()
        });
        shader.setVertices(FimTwoTriangles.vertexPositions, FimTwoTriangles.textureCoords);
        await image.executeAsync(shader);

        // Ensure the output is red
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

    it('Executes a shader with a vertex matrix', async () => {
      await usingAsync(factory(), async fim => {
        // Create a WebGL shader and destination image
        const shader = fim.createGLShader(fillUniformShader);
        const image = fim.createImageWithFill(TestSizes.smallWide, TestColors.black);

        // Execute the shader
        shader.setUniforms({
          uColor: TestColors.blue.toVector()
        });
        shader.applyVertexMatrix(new FimTransform3D());
        await image.executeAsync(shader);

        // Ensure the output is blue
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.blue);
      });
    });

    it('Preserves background with vertex matrices', async () => {
      await usingAsync(factory(), async fim => {
        const copy = new FimOpCopy(fim);

        const red = fim.createImageWithFill(TestSizes.smallWide, TestColors.red);
        const output = fim.createImageWithFill(TestSizes.smallWide, TestColors.blue);

        // Copy red, shifted down and to the right 50%
        const matrix = new FimTransform2D();
        matrix.translation(1, 1);

        // Execute copy shader
        await output.executeAsync(copy.$(red, matrix));

        // Validate expected output
        expect(await output.getPixelAsync(topLeft(TestSizes.smallWide))).toEqual(TestColors.blue);
        expect(await output.getPixelAsync(topRight(TestSizes.smallWide))).toEqual(TestColors.red);
        expect(await output.getPixelAsync(bottomLeft(TestSizes.smallWide))).toEqual(TestColors.blue);
        expect(await output.getPixelAsync(bottomRight(TestSizes.smallWide))).toEqual(TestColors.blue);
      });

    });

  });
}
