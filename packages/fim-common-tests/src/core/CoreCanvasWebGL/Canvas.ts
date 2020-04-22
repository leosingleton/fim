// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { canvasOptions, textureOptions } from '../../common/CoreOptions';
import { bottomLeft, bottomRight, midpoint, topLeft, topRight } from '../../common/Globals';
import { TestColors } from '../../common/TestColors';
import { TestImages } from '../../common/TestImages';
import { TestSizes } from '../../common/TestSizes';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions, FimPoint, FimRect } from '@leosingleton/fim';
import { CoreCanvasOptions, CoreCanvasWebGL, CoreTexture } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for canvas operations */
export function coreCanvasWebGLTestSuiteCanvas(
  description: string,
  factory: (dimensions: FimDimensions, canvasOptions: CoreCanvasOptions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Canvas - ${description}`, () => {

    it('Fills with solid colors', () => {
      using(factory(TestSizes.smallWide, canvasOptions), canvas => {
        canvas.fillSolid(TestColors.red);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);
        canvas.fillSolid(TestColors.blue);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.blue);
      });
    });

    it('Copies from textures 1', () => {
      using(factory(TestSizes.smallWide, canvasOptions), canvas => {
        // Create a texture of solid blue
        const texture = canvas.createCoreTexture(TestSizes.smallWide, textureOptions);
        texture.fillSolid(TestColors.blue);

        // Fill the WebGL canvas with green
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the texture copied correctly
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.blue);
      });
    });

    it('Copies from textures 2', async () => {
      await usingAsync(factory(TestSizes.smallWide, canvasOptions), async canvas => {
        // Create a canvas of solid red
        const temp = canvas.createTemporaryCanvas2D();
        temp.fillSolid(TestColors.red);

        // Copy the canvas to a texture
        const texture = canvas.createCoreTexture(TestSizes.smallWide, textureOptions);
        await texture.copyFromAsync(temp);

        // Fill the WebGL canvas with green
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the texture copied correctly
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

    it('Copies from textures 3', async () => {
      await usingAsync(factory(TestSizes.smallSquare, canvasOptions), async canvas => {
        // Create a test image the size of the canvas
        const texture = await createFourSquaresTexture(canvas);

        // Fill the WebGL canvas with green
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(TestSizes.smallSquare))).toEqual(TestColors.green);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the texture copied correctly
        await TestImages.expectFourSquaresPngCanvasAsync(canvas);
      });
    });

    it('Copies from textures with srcCoords', async () => {
      await usingAsync(factory(TestSizes.mediumTall, canvasOptions), async canvas => {
        // Create a test image the size of the canvas
        const texture = await createFourSquaresTexture(canvas);

        // Fill the WebGL canvas with green
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(TestSizes.mediumTall))).toEqual(TestColors.green);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture, FimRect.fromPoints(midpoint(TestSizes.smallSquare), topRight(TestSizes.smallSquare)));

        // Check a few pixels to ensure the texture rendered correctly
        expect(canvas.getPixel(topLeft(TestSizes.mediumTall))).toEqual(TestColors.green);
        expect(canvas.getPixel(topRight(TestSizes.mediumTall))).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomLeft(TestSizes.mediumTall))).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomRight(TestSizes.mediumTall))).toEqual(TestColors.green);
      });
    });

    it('Copies from textures with srcCoords and destCoords', async () => {
      await usingAsync(factory(TestSizes.mediumTall, canvasOptions), async canvas => {
        // Create a test image the size of the canvas
        const texture = await createFourSquaresTexture(canvas, TestSizes.mediumTall);

        // Fill the WebGL canvas with blue
        canvas.fillSolid(TestColors.blue);
        expect(canvas.getPixel(midpoint(TestSizes.mediumTall))).toEqual(TestColors.blue);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture, FimRect.fromPoints(FimPoint.fromXY(0, 0), midpoint(TestSizes.mediumTall)),
          FimRect.fromPointWidthHeight(midpoint(TestSizes.mediumTall), TestSizes.mediumTall.w / 2,
            TestSizes.mediumTall.h / 2));

        // Check a few pixels to ensure the texture rendered correctly
        expect(canvas.getPixel(topLeft(TestSizes.mediumTall))).toEqual(TestColors.blue);
        expect(canvas.getPixel(topRight(TestSizes.mediumTall))).toEqual(TestColors.blue);
        expect(canvas.getPixel(bottomLeft(TestSizes.mediumTall))).toEqual(TestColors.blue);
        expect(canvas.getPixel(bottomRight(TestSizes.mediumTall))).toEqual(TestColors.red);
      });
    });

    it('Copies texture to texture', async () => {
      await usingAsync(factory(TestSizes.smallSquare, canvasOptions), async canvas => {
        // Load the four squares test image
        const texture1 = await createFourSquaresTexture(canvas);

        // Copy the texture to another
        const texture2 = canvas.createCoreTexture(TestSizes.smallSquare, textureOptions);
        texture2.copyFromTexture(texture1);

        // Render the second texture to the WebGL canvas
        canvas.copyFrom(texture2);

        // Ensure the texture copied correctly
        await TestImages.expectFourSquaresPngCanvasAsync(canvas);
      });
    });

    it('Copies texture to texture with srcCoords', async () => {
      await usingAsync(factory(TestSizes.smallSquare, canvasOptions), async canvas => {
        // Load the four squares test image
        const texture1 = await createFourSquaresTexture(canvas);

        // Copy the texture to another
        const texture2 = canvas.createCoreTexture(TestSizes.smallSquare, textureOptions);
        texture2.copyFromTexture(texture1, FimRect.fromPoints(midpoint(TestSizes.smallSquare),
          topRight(TestSizes.smallSquare)));

        // Render the second texture to the WebGL canvas
        canvas.copyFrom(texture2);

        // Check a few pixels to ensure the texture rendered correctly
        expect(canvas.getPixel(topLeft())).toEqual(TestColors.green);
        expect(canvas.getPixel(topRight())).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomLeft())).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomRight())).toEqual(TestColors.green);
      });
    });

  });
}

/**
 * Loads the four squares test pattern onto a WebGL texture
 * @param canvas WebGL canvas
 * @param dimensions Dimensions of the output texture. Defaults to 128x128 (smallFourSquares dimensions)
 * @returns WebGL texture. The caller is responsible for calling `dispose()` on the result.
 */
async function createFourSquaresTexture(canvas: CoreCanvasWebGL, dimensions = TestSizes.smallSquare):
    Promise<CoreTexture> {
  const texture = canvas.createCoreTexture(dimensions, textureOptions);

  // Load the JPEG to a temporary canvas then copy it to the texture
  await usingAsync(canvas.createTemporaryCanvas2D(dimensions, canvasOptions), async temp => {
    const jpeg = TestImages.fourSquaresPng();
    await temp.loadFromJpegAsync(jpeg);
    await texture.copyFromAsync(temp);
  });

  return texture;
}
