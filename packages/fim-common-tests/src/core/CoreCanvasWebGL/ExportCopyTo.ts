// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, bottomLeft, bottomRight, green, midpoint, red, small, smallFourSquares, topLeft,
  topRight } from '../../common/Globals';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/internals';
import { TestImages } from '../../common/TestImages';

/** CoreCanvasWebGL test cases for exporting and copying to other objects */
export function coreCanvasWebGLTestSuiteExportCopyTo(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Export/CopyTo - ${description}`, () => {

    it('Exports to pixel data', () => {
      using(factory(small), canvas => {
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
      await usingAsync(factory(smallFourSquares), async canvas => {
        // Load the four squares test pattern on to a texture
        const texture = canvas.createCoreTexture();
        await usingAsync(canvas.createTemporaryCanvas2D(), async temp => {
          await temp.loadFromPngAsync(TestImages.fourSquaresPng());
          texture.copyFrom(temp);
        });

        // Render the texture to the WebGL canvas
        canvas.copyFrom(texture);
        expect(canvas.getPixel(topLeft())).toEqual(red);
        expect(canvas.getPixel(topRight())).toEqual(green);
        expect(canvas.getPixel(bottomLeft())).toEqual(blue);
        expect(canvas.getPixel(bottomRight())).toEqual(black);

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

    xit('Copies to a CoreCanvas2D', () => {
      using(factory(small), canvas => {
        // Fill the WebGL canvas with red
        canvas.fillSolid(red);

        // Copy the WebGL canvas to a CoreCanvas2D
        using(canvas.createTemporaryCanvas2D(), temp => {
          temp.copyFrom(canvas);
          expect(temp.getPixel(midpoint(small))).toEqual(red);
        });
      });
    });

    xit('Copies to a CoreTexture', () => {
      using(factory(small), canvas => {
        // Fill the WebGL canvas with red
        canvas.fillSolid(red);

        // Copy the WebGL canvas to a CoreTexture
        const texture = canvas.createCoreTexture();
        texture.copyFrom(canvas);

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
