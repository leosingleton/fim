// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim, loadTestImage, renderOutput } from './Common';
import { FimGLProgramCopy, FimGLTextureFlags, Transform3D } from '../../build/dist/index.js';
import { DisposableSet, Stopwatch, Task, UnhandledError } from '@leosingleton/commonlibs';

export async function glTransform3D(canvasId: string): Promise<void> {
  // Load the test image, and create a WebGL canvas and two texture the same dimensions
  const srcImage = await loadTestImage();
  const gl = fim.createGLCanvas(srcImage.w, srcImage.h);

  while (true) {
    const disposable = new DisposableSet();
    try {
      // Create a WebGL texture containing the sample image
      const texture = disposable.addDisposable(gl.createTextureFrom(srcImage, FimGLTextureFlags.LinearSampling));

      // Create a WebGL program to copy the image
      const program = disposable.addDisposable(new FimGLProgramCopy(gl));

      // Animation loop
      const clock = Stopwatch.startNew();
      let frameCount = 0;
      while (true) {
        // Rotate X-axis 360 degrees every 5 seconds, Y-axis every 12 seconds, and Z-axis every 60 seconds
        const twoPIms = Math.PI * 2 * clock.getElapsedMilliseconds();
        const angleX = twoPIms / 5000;
        const angleY = twoPIms / 12000;
        const angleZ = twoPIms / 60000;

        // Calculate the vertex transformation matrix. Note that the operations are applied in reverse order due to the
        // way matrix multiplication works. Translate, then rotate, then scale.
        const matrix = new Transform3D();
        matrix.rescale(texture.w, texture.h, texture.w);
        matrix.rotateX(angleX);
        matrix.rotateY(angleY);
        matrix.rotateZ(angleZ);
        matrix.rescale(1 / texture.w, 1 / texture.h, 1 / texture.w);

        // Clear any existing image on the WebGL canvas
        gl.fillCanvas('#000');

        program.setInputs(texture);
        program.applyVertexMatrix(matrix);
        program.execute();

        // Copy the result to the screen
        const fps = ++frameCount * 1000 / clock.getElapsedMilliseconds();
        const message = `FPS=${fps.toFixed(2)}`;
        await renderOutput(gl, message, null, canvasId);
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
