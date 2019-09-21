// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim, loadTestImage, renderOutput } from './Common';
import { FimGLProgramMatrixOperation1DFast, FimGLTextureFlags, FimGLProgramCopy,
  GaussianKernel } from '../../build/dist/index.js';
import { DisposableSet, Stopwatch, Task, UnhandledError } from '@leosingleton/commonlibs';

export async function glStress(testCase: string, canvasId: string): Promise<void> {
  // Load the test image, and create a WebGL canvas and two texture the same dimensions
  let srcImage = await loadTestImage();
  let gl = fim.createGLCanvas(srcImage.w, srcImage.h);

  let count = 1;
  while (true) {
    let disposable = new DisposableSet();
    try {
      let input = disposable.addDisposable(gl.createTextureFrom(srcImage, FimGLTextureFlags.LinearSampling));
      let texture = disposable.addDisposable(gl.createTexture(srcImage.w, srcImage.h,
        { textureFlags: FimGLTextureFlags.LinearSampling }));
      let temp = disposable.addDisposable(gl.createTexture(srcImage.w, srcImage.h,
        { textureFlags: FimGLTextureFlags.LinearSampling }));
  
      // Create a Gaussian blur
      let kernel = GaussianKernel.calculate(1, 31);
      let copy = disposable.addDisposable(new FimGLProgramCopy(gl));
      let blur = disposable.addDisposable(new FimGLProgramMatrixOperation1DFast(gl, 31));

      // Render loop
      while (true) {
        let timer = Stopwatch.startNew();

        let caseName: string;
        if (testCase === 'executions') {
          //
          // In this test case, we increase the number of iterations of a Gaussian blur to create a larger and larger
          // stress test
          //
          caseName = 'Program Executions';

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
        } else if (testCase === 'texImage2D') {
          //
          // In this test case, we repeatedly load a texture with texImage2D
          //
          caseName = 'texImage2D Operations';

          for (let n = 0; n < count; n++) {
            input.copyFrom(srcImage);
          }

          // Copy the texture to the output WebGL canvas
          copy.setInputs(input);
          copy.execute();
        }
        let time = timer.getElapsedMilliseconds();

        // Render output
        let message = `WebGL Stress\n${caseName}: ${count + 2}\nTime: ${time.toFixed(2)} ms`;
        await renderOutput(gl, message, null, canvasId);

        count++;
      }
    } catch (ex) {
      // Log the error
      console.log(ex);
      UnhandledError.reportError(ex);

      // Free resources
      disposable.dispose();

      // Try again after 1 second
      await Task.delayAsync(1000);
    }
  }
}
