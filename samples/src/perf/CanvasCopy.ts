// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loadTestImage, perfTest, renderOutput, textureToCanvas } from '../Common';
import { FimCanvas, FimGLCanvas, FimGLTexture } from '../../../build/dist/index.js';
import { DisposableSet, usingAsync } from '@leosingleton/commonlibs';

export async function perfCanvasCopy(): Promise<void> {
  usingAsync(await loadTestImage(), async srcImage => {
    //
    // Test case to copy 2D canvas to 2D canvas
    //
    async function test2DCopy(outputWidth: number, outputHeight: number, inputWidth: number, inputHeight: number):
        Promise<void> {
      await DisposableSet.usingAsync(async disposable => {
        // Rescale the input image
        let input = disposable.addDisposable(new FimCanvas(inputWidth, inputHeight));
        input.copyFrom(srcImage);

        // Create the output canvas
        let canvas = disposable.addDisposable(new FimCanvas(outputWidth, outputHeight));

        // Run performance test
        let d = `Copy ${inputWidth}x${inputHeight} 2D canvas to ${outputWidth}x${outputHeight} 2D canvas`;
        let results = perfTest(d, () => {
          canvas.copyFrom(input);
        })

        // Render output
        await renderOutput(canvas, results.message, 360);
      });
    }

    await test2DCopy(srcImage.w, srcImage.h, srcImage.w, srcImage.h);
    await test2DCopy(srcImage.w, srcImage.h, 2048, 2048);
    await test2DCopy(srcImage.w, srcImage.h, 4096, 4096);
    await test2DCopy(2048, 2048, srcImage.w, srcImage.h);
    await test2DCopy(2048, 2048, 2048, 2048);
    await test2DCopy(2048, 2048, 4096, 4096);
    await test2DCopy(4096, 4096, srcImage.w, srcImage.h);
    await test2DCopy(4096, 4096, 2048, 2048);
    await test2DCopy(4096, 4096, 4096, 4096);

    //
    // Test case to copy WebGL canvas to 2D canvas
    //
    async function testGLCopy(width: number, height: number): Promise<void> {
      await DisposableSet.usingAsync(async disposable => {
        // Create a WebGL canvas and copy an image onto it
        let gl = disposable.addDisposable(new FimGLCanvas(width, height));
        let t = disposable.addDisposable(FimGLTexture.createFrom(gl, srcImage));
        textureToCanvas(gl, t);
        let canvas = disposable.addDisposable(new FimCanvas(width, height));

        // Run performance test
        let d = `Copy ${width}x${height} WebGL canvas to 2D canvas`;
        let results = perfTest(d, () => {
          canvas.copyFrom(gl);
        })

        // Render output
        await renderOutput(gl, results.message, 360);
      });
    }

    await testGLCopy(srcImage.w, srcImage.h);
    await testGLCopy(2048, 2048);
    await testGLCopy(4096, 4096);
  });
}
