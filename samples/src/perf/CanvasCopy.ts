// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim, loadTestImage, perfTest, renderOutput, textureToCanvas, recordPerformanceValue } from '../Common';
import { DisposableSet, usingAsync } from '@leosingleton/commonlibs';

export async function perfCanvasCopy(): Promise<void> {
  await usingAsync(await loadTestImage(), async srcImage => {
    //
    // Test case to copy 2D canvas to 2D canvas
    //
    async function test2DCopy(id: string, outputWidth: number, outputHeight: number, inputWidth: number,
        inputHeight: number): Promise<void> {
      await DisposableSet.usingAsync(async disposable => {
        // Rescale the input image
        const input = disposable.addDisposable(fim.createCanvas(inputWidth, inputHeight));
        input.copyFrom(srcImage);

        // Create the output canvas
        const canvas = disposable.addDisposable(fim.createCanvas(outputWidth, outputHeight));

        // Run performance test
        const d = `Copy ${inputWidth}x${inputHeight} 2D canvas to ${outputWidth}x${outputHeight} 2D canvas`;
        const results = perfTest(d, () => {
          canvas.copyFrom(input);
        });

        // Render output
        await renderOutput(canvas, results.message, 360);
        recordPerformanceValue(id, results);
      });
    }

    await test2DCopy('wh-wh', srcImage.w, srcImage.h, srcImage.w, srcImage.h);
    await test2DCopy('wh-22', srcImage.w, srcImage.h, 2048, 2048);
    await test2DCopy('wh-44', srcImage.w, srcImage.h, 4096, 4096);
    await test2DCopy('22-wh', 2048, 2048, srcImage.w, srcImage.h);
    await test2DCopy('22-22', 2048, 2048, 2048, 2048);
    await test2DCopy('22-44', 2048, 2048, 4096, 4096);
    await test2DCopy('44-wh', 4096, 4096, srcImage.w, srcImage.h);
    await test2DCopy('44-22', 4096, 4096, 2048, 2048);
    await test2DCopy('44-44', 4096, 4096, 4096, 4096);

    //
    // Test case to copy WebGL canvas to 2D canvas
    //
    async function testGLCopy(id: string, width: number, height: number): Promise<void> {
      await DisposableSet.usingAsync(async disposable => {
        // Create a WebGL canvas and copy an image onto it
        const gl = disposable.addDisposable(fim.createGLCanvas(width, height));
        const t = disposable.addDisposable(gl.createTextureFrom(srcImage));
        textureToCanvas(gl, t);
        const canvas = disposable.addDisposable(fim.createCanvas(width, height));

        // Run performance test
        const d = `Copy ${width}x${height} WebGL canvas to 2D canvas`;
        const results = perfTest(d, () => {
          canvas.copyFrom(gl);
        });

        // Render output
        await renderOutput(gl, results.message, 360);
        recordPerformanceValue(id, results);
      });
    }

    await testGLCopy('gl-wh', srcImage.w, srcImage.h);
    await testGLCopy('gl-22', 2048, 2048);
    await testGLCopy('gl-44', 4096, 4096);
  });
}
