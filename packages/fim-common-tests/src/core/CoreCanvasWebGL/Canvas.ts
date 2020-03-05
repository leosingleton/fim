// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

//import { black, blue, bottomLeft, bottomRight, green, midpoint, red, small, smallFourSquares, topLeft,
//  topRight } from '../../common/Globals';
import { green, midpoint, small } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
//import { CoreCanvasWebGL, CoreTexture, defaultImageOptions } from '@leosingleton/fim/build/internal';
import { CoreCanvasWebGL } from '@leosingleton/fim/build/internal';

/** CoreCanvasWebGL test cases for canvas operations */
export function coreCanvasWebGLTestSuiteCanvas(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Canvas - ${description}`, () => {

    it('Fills with solid colors', () => {
      using(factory(small), canvas => {
        canvas.fillCanvas(green);
        expect(canvas.getPixel(midpoint(small))).toEqual(green);
      });
    });

    /*it('Copies from textures', async () => {
      await usingAsync(factory(smallFourSquares), async canvas => {
        // Create a test image the size of the canvas
        const texture = await createFourSquaresTexture(canvas);

        // Copy the texture
        canvas.copyFrom(texture);

        // Check a few pixels to ensure the texture rendered correctly
        expect(canvas.getPixel(topLeft())).toEqual(red);
        expect(canvas.getPixel(topRight())).toEqual(green);
        expect(canvas.getPixel(bottomLeft())).toEqual(blue);
        expect(canvas.getPixel(bottomRight())).toEqual(black);
      });
    });*/

    /*it('Copies from textures with srcCoords', async () => {
      await usingAsync(factory(medium), async canvas => {
        // Create a test image the size of the canvas
        const texture = await createFourSquaresTexture(canvas);

        // Copy the texture
        canvas.copyFrom(texture, FimRect.fromPoints(midpoint(smallFourSquares), topRight(smallFourSquares)));

        // Check a few pixels to ensure the texture rendered correctly
        expect(canvas.getPixel(topLeft(medium))).toEqual(green);
        expect(canvas.getPixel(topRight(medium))).toEqual(green);
        expect(canvas.getPixel(bottomLeft(medium))).toEqual(green);
        expect(canvas.getPixel(bottomRight(medium))).toEqual(green);
      });
    });*/

/*

    it('Copies from textures with srcCoords and destCoords', async () => {
      await DisposableSet.usingAsync(async disposable => {
        const fim = disposable.addDisposable(new FimWeb(canvasFactory));
        const gl = disposable.addDisposable(fim.createGLCanvas(240, 240, '#00f'));

        // Create a test image the size of the canvas
        const texture = disposable.addDisposable(gl.createTexture(240, 240));
        const jpeg = FimTestImages.fourSquaresJpeg();
        const buffer = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
        texture.copyFrom(buffer);

        // Copy the texture
        gl.copyFrom(texture,
          FimRect.fromXYWidthHeight(0, 0, texture.w / 2, texture.h / 2),
          FimRect.fromXYWidthHeight(120, 120, 120, 120));

        // Check a few pixels to ensure the texture rendered correctly
        expectToBeCloseTo(gl.getPixel(60, 60), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(180, 60), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(60, 180), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(180, 180), FimColor.fromString('#f00'));
      });
    });
*/
  });
}

/**
 * Loads the four squares test pattern onto a WebGL texture
 * @param canvas WebGL canvas
 * @returns WebGL texture. The caller is responsible for calling `dispose()` on the result.
 */
/*async function createFourSquaresTexture(canvas: CoreCanvasWebGL): Promise<CoreTexture> {
  const texture = canvas.createCoreTexture(smallFourSquares, defaultImageOptions);

  // Load the JPEG to a temporary canvas then copy it to the texture
  await usingAsync(canvas.createTemporaryCanvas2D(smallFourSquares), async temp => {
    const jpeg = TestImages.fourSquaresPng();
    await temp.loadFromJpegAsync(jpeg);
    texture.copyFrom(temp);
  });

  return texture;
}
*/