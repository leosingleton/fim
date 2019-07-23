// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas, FimGLTexture, FimGLProgramMatrixOperation1DFast,
  FimGLTextureFlags, GaussianKernel } from '../../build/dist/index.js';
import { handleError, loadTestImage, renderOutput } from './Common';
import { DisposableSet, Stopwatch, Task } from '@leosingleton/commonlibs';

export async function glStress(canvasId: string): Promise<void> {
  // Load the test image, and create a WebGL canvas and two texture the same dimensions
  let srcImage = await loadTestImage();
  let gl = new FimGLCanvas(srcImage.w, srcImage.h);

  let count = 1;
  while (true) {
    let disposable = new DisposableSet();
    try {
      let input = disposable.addDisposable(FimGLTexture.createFrom(gl, srcImage,
        FimGLTextureFlags.LinearSampling));
      let texture = disposable.addDisposable(new FimGLTexture(gl, srcImage.w, srcImage.h,
        FimGLTextureFlags.LinearSampling));
      let temp = disposable.addDisposable(new FimGLTexture(gl, srcImage.w, srcImage.h,
        FimGLTextureFlags.LinearSampling));
  
      // Create a Gaussian blur
      let kernel = GaussianKernel.calculate(1, 31);
      let blur = disposable.addDisposable(new FimGLProgramMatrixOperation1DFast(gl, 31));

      // Render loop
      while (true) {
        let timer = Stopwatch.startNew();

        // On the first run, read from the input
        blur.setInputs(input, kernel, temp);
        blur.execute(texture);

        // On subsequent runs, output to the texture. WebGL normally doesn't allow reading and writing to the same
        // texture at the same time, but this works because FimGLProgramMatrixOperation1D uses a temporary texture
        // internally.
        for (let n = 0; n < count; n++) {
          blur.setInputs(texture, kernel, temp);
          blur.execute(texture);
        }

        // On the final run, output to the WebGL canvas
        blur.setInputs(texture, kernel, temp);
        blur.execute();
        let time = timer.getElapsedMilliseconds();

        // Render output
        let message = `WebGL Stress\nProgram Executions: ${count + 2}\nTime: ${time.toFixed(2)} ms`;
        await renderOutput(gl, message, null, canvasId);

        count++;
      }
    } catch (ex) {
      // Log the error
      console.log(ex);
      handleError(ex);

      // Free resources
      disposable.dispose();

      // Try again after 1 second
      await Task.delay(1000);
    }
  }
}