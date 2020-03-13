// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loseContextAsync, restoreContextAsync } from '../../common/ContextLost';
import { blue, green, midpoint, red, small } from '../../common/Globals';
import { usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for context lost simulation */
export function coreCanvasWebGLTestSuiteContextLost(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Context Lost - ${description}`, () => {

    it('Simulate a context loss', async () => {
      await usingAsync(factory(small), async canvas => {
        // Simulate a context loss
        expect(canvas.isContextLost).toBeFalsy();
        await loseContextAsync(canvas);
        expect(canvas.isContextLost).toBeTruthy();

        // Calls while context is lost will throw an exception
        expect(() => canvas.fillSolid(red)).toThrow();
      });
    });

    it('Simulate a context loss and restored', async () => {
      await usingAsync(factory(small), async canvas => {
        // Simulate a context loss and immediate restore
        expect(canvas.isContextLost).toBeFalsy();
        await loseContextAsync(canvas);
        expect(canvas.isContextLost).toBeTruthy();
        await restoreContextAsync(canvas);
        expect(canvas.isContextLost).toBeFalsy();

        // Calls after context is restored will succeed
        canvas.fillSolid(red);
        expect(canvas.getPixel(midpoint(small))).toEqual(red);
      });
    });

    it('Simulate a complex context loss', async () => {
      await usingAsync(factory(small), async canvas => {
        // Fill the WebGL canvas with red
        canvas.fillSolid(red);

        // Create a green texture
        const texture1 = canvas.createCoreTexture();
        texture1.fillSolid(green);

        // The image data on the canvas and texture is now valid
        expect(canvas.hasImage).toBeTruthy();
        expect(texture1.hasImage).toBeTruthy();

        // Copy the green texture to the canvas
        canvas.copyFrom(texture1);
        expect(canvas.getPixel(midpoint(small))).toEqual(green);

        // Simulate a context loss
        await loseContextAsync(canvas);

        // The image data on the canvas and texture have been invalidated
        expect(canvas.hasImage).toBeFalsy();
        expect(texture1.hasImage).toBeFalsy();

        // Calls to the canvas and texture throw exceptions
        expect(() => canvas.fillSolid(red)).toThrow();
        expect(() => texture1.fillSolid(red)).toThrow();

        // Restore the context
        await restoreContextAsync(canvas);

        // The previous texture has been disposed and cannot be reused
        expect(() => canvas.copyFrom(texture1)).toThrow();
        expect(() => texture1.dispose()).toThrow();

        // Create a new texture and copy it to the WebGL canvas, this time with blue
        const texture2 = canvas.createCoreTexture();
        texture2.fillSolid(blue);
        canvas.copyFrom(texture2);
        expect(canvas.getPixel(midpoint(small))).toEqual(blue);
      });
    });

  });
}
