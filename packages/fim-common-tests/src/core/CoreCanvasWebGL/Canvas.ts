// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { canvasOptions, textureOptions } from '../../common/CoreOptions';
import { bottomLeft, bottomRight, medium, midpoint, small, smallFourSquares, topLeft,
  topRight } from '../../common/Globals';
import { TestColors } from '../../common/TestColors';
import { TestImages } from '../../common/TestImages';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions, FimPoint, FimRect } from '@leosingleton/fim';
import { CoreCanvasOptions, CoreCanvasWebGL, CoreTexture } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for canvas operations */
export function coreCanvasWebGLTestSuiteCanvas(
  description: string,
  factory: (canvasOptions: CoreCanvasOptions, dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Canvas - ${description}`, () => {

    it('Fills with solid colors', () => {
      using(factory(canvasOptions, small), canvas => {
        canvas.fillSolid(TestColors.red);
        expect(canvas.getPixel(midpoint(small))).toEqual(TestColors.red);
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(small))).toEqual(TestColors.green);
        canvas.fillSolid(TestColors.blue);
        expect(canvas.getPixel(midpoint(small))).toEqual(TestColors.blue);
      });
    });

    it('Copies from textures 1', () => {
      using(factory(canvasOptions, small), canvas => {
        // Create a texture of solid blue
        const texture = canvas.createCoreTexture(textureOptions);
        texture.fillSolid(TestColors.blue);

        // Fill the WebGL canvas with green
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(small))).toEqual(TestColors.green);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the texture copied correctly
        expect(canvas.getPixel(midpoint(small))).toEqual(TestColors.blue);
      });
    });

    it('Copies from textures 2', async () => {
      await usingAsync(factory(canvasOptions, small), async canvas => {
        // Create a canvas of solid red
        const temp = canvas.createTemporaryCanvas2D();
        temp.fillSolid(TestColors.red);

        // Copy the canvas to a texture
        const texture = canvas.createCoreTexture(textureOptions);
        await texture.copyFromAsync(temp);

        // Fill the WebGL canvas with green
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(small))).toEqual(TestColors.green);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the texture copied correctly
        expect(canvas.getPixel(midpoint(small))).toEqual(TestColors.red);
      });
    });

    it('Copies from textures 3', async () => {
      await usingAsync(factory(canvasOptions, smallFourSquares), async canvas => {
        // Create a test image the size of the canvas
        const texture = await createFourSquaresTexture(canvas);

        // Fill the WebGL canvas with green
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(small))).toEqual(TestColors.green);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the texture copied correctly
        expect(canvas.getPixel(topLeft())).toEqual(TestColors.red);
        expect(canvas.getPixel(topRight())).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomLeft())).toEqual(TestColors.blue);
        expect(canvas.getPixel(bottomRight())).toEqual(TestColors.black);
      });
    });

    it('Copies from textures with srcCoords', async () => {
      await usingAsync(factory(canvasOptions, medium), async canvas => {
        // Create a test image the size of the canvas
        const texture = await createFourSquaresTexture(canvas);

        // Fill the WebGL canvas with green
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(medium))).toEqual(TestColors.green);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture, FimRect.fromPoints(midpoint(smallFourSquares), topRight(smallFourSquares)));

        // Check a few pixels to ensure the texture rendered correctly
        expect(canvas.getPixel(topLeft(medium))).toEqual(TestColors.green);
        expect(canvas.getPixel(topRight(medium))).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomLeft(medium))).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomRight(medium))).toEqual(TestColors.green);
      });
    });

    it('Copies from textures with srcCoords and destCoords', async () => {
      await usingAsync(factory(canvasOptions, medium), async canvas => {
        // Create a test image the size of the canvas
        const texture = await createFourSquaresTexture(canvas, medium);

        // Fill the WebGL canvas with blue
        canvas.fillSolid(TestColors.blue);
        expect(canvas.getPixel(midpoint(medium))).toEqual(TestColors.blue);

        // Copy the texture to the WebGL canvas
        canvas.copyFrom(texture,
          FimRect.fromPoints(FimPoint.fromXY(0, 0), midpoint(medium)),
          FimRect.fromPointWidthHeight(midpoint(medium), medium.w / 2, medium.h / 2));

        // Check a few pixels to ensure the texture rendered correctly
        expect(canvas.getPixel(topLeft(medium))).toEqual(TestColors.blue);
        expect(canvas.getPixel(topRight(medium))).toEqual(TestColors.blue);
        expect(canvas.getPixel(bottomLeft(medium))).toEqual(TestColors.blue);
        expect(canvas.getPixel(bottomRight(medium))).toEqual(TestColors.red);
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
async function createFourSquaresTexture(canvas: CoreCanvasWebGL, dimensions = smallFourSquares): Promise<CoreTexture> {
  const texture = canvas.createCoreTexture(textureOptions, dimensions);

  // Load the JPEG to a temporary canvas then copy it to the texture
  await usingAsync(canvas.createTemporaryCanvas2D(canvasOptions, dimensions), async temp => {
    const jpeg = TestImages.fourSquaresPng();
    await temp.loadFromJpegAsync(jpeg, true);
    await texture.copyFromAsync(temp);
  });

  return texture;
}
