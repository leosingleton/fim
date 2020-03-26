// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { canvasOptions, textureOptions } from '../../common/CoreOptions';
import { black, blue, bottomLeft, bottomRight, green, midpoint, red, small, smallFourSquares, topLeft,
  topRight } from '../../common/Globals';
import { TestImages } from '../../common/TestImages';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions, FimRect } from '@leosingleton/fim';
import { CoreCanvasOptions, CoreCanvasWebGL } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for exporting and copying to other objects */
export function coreCanvasWebGLTestSuiteExportCopyTo(
  description: string,
  factory: (canvasOptions: CoreCanvasOptions, dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Export/CopyTo - ${description}`, () => {

    it('Exports to pixel data', () => {
      using(factory(canvasOptions, small), canvas => {
        canvas.fillSolid(red);
        const data = canvas.exportToPixelData();

        expect(data.length).toEqual(small.getArea() * 4);
        expect(data[0]).toEqual(255); // R
        expect(data[1]).toEqual(0);   // G
        expect(data[2]).toEqual(0);   // B
        expect(data[3]).toEqual(255); // A
      });
    });

    it('Exports to pixel data without flipping image', async () => {
      await usingAsync(factory(canvasOptions, smallFourSquares), async canvas => {
        // Render the four squares test pattern onto a WebGL canvas
        await renderFourSquares(canvas);

        // Export the WebGL canvas to pixel data
        const data = canvas.exportToPixelData();

        // Load the pixel data onto a temporary 2D canvas
        await usingAsync(canvas.createTemporaryCanvas2D(), async temp => {
          await temp.loadPixelDataAsync(data);
          expect(temp.getPixel(topLeft())).toEqual(red);
          expect(temp.getPixel(topRight())).toEqual(green);
          expect(temp.getPixel(bottomLeft())).toEqual(blue);
          expect(temp.getPixel(bottomRight())).toEqual(black);
        });
      });
    });

    it('Exports a region to pixel data', async () => {
      await usingAsync(factory(canvasOptions, smallFourSquares), async canvas => {
        // Render the four squares test pattern onto a WebGL canvas
        await renderFourSquares(canvas);

        // Export only the bottom-left corner (blue)
        const srcCoords = FimRect.fromXYWidthHeight(0, smallFourSquares.h / 2, smallFourSquares.w / 2,
          smallFourSquares.h / 2);
        const data = canvas.exportToPixelData(srcCoords);

        expect(data.length).toEqual(srcCoords.getArea() * 4);
        expect(data[0]).toEqual(0);   // R
        expect(data[1]).toEqual(0);   // G
        expect(data[2]).toEqual(255); // B
        expect(data[3]).toEqual(255); // A
      });
    });

    it('Copies to a CoreCanvas2D', async () => {
      await usingAsync(factory(canvasOptions, small), async canvas => {
        // Fill the WebGL canvas with red
        canvas.fillSolid(red);

        // Copy the WebGL canvas to a CoreCanvas2D
        await usingAsync(canvas.createTemporaryCanvas2D(), async temp => {
          await temp.copyFromAsync(canvas);
          expect(temp.getPixel(midpoint(small))).toEqual(red);
        });
      });
    });

    it('Copies to a CoreTexture', async () => {
      await usingAsync(factory(canvasOptions, small), async canvas => {
        // Fill the WebGL canvas with red
        canvas.fillSolid(red);

        // Copy the WebGL canvas to a CoreTexture
        const texture = canvas.createCoreTexture(textureOptions);
        await texture.copyFromAsync(canvas);

        // Fill the WebGL canvas with green
        canvas.fillSolid(green);
        expect(canvas.getPixel(midpoint(small))).toEqual(green);

        // Render the CoreTexture to the WebGL canvas and ensure it is red
        canvas.copyFrom(texture);
        expect(canvas.getPixel(midpoint(small))).toEqual(red);
      });
    });

  });
}

/** Helper function to render the four squares test pattern onto a WebGL canvas */
async function renderFourSquares(canvas: CoreCanvasWebGL): Promise<void> {
  // Load the four squares test pattern on to a texture
  const texture = canvas.createCoreTexture(textureOptions);
  await usingAsync(canvas.createTemporaryCanvas2D(), async temp => {
    await temp.loadFromPngAsync(TestImages.fourSquaresPng());
    await texture.copyFromAsync(temp);
  });

  // Render the texture to the WebGL canvas
  canvas.copyFrom(texture);
  expect(canvas.getPixel(topLeft())).toEqual(red);
  expect(canvas.getPixel(topRight())).toEqual(green);
  expect(canvas.getPixel(bottomLeft())).toEqual(blue);
  expect(canvas.getPixel(bottomRight())).toEqual(black);
}