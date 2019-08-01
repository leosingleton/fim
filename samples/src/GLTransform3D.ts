// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loadTestImage, handleError, renderOutput } from './Common';
import { FimGLCanvas, FimGLTexture, FimGLProgramCopy, FimGLTextureFlags,
  Transform3D } from '../../build/dist/index.js';
import { DisposableSet, Stopwatch, Task } from '@leosingleton/commonlibs';

export async function glTransform3D(canvasId: string): Promise<void> {
  // Load the test image, and create a WebGL canvas and two texture the same dimensions
  let srcImage = await loadTestImage();
  let gl = new FimGLCanvas(srcImage.w, srcImage.h);

  while (true) {
    let disposable = new DisposableSet();
    try {
      // Create a WebGL texture containing the sample image
      let texture = disposable.addDisposable(FimGLTexture.createFrom(gl, srcImage, FimGLTextureFlags.LinearSampling));

      // Create a WebGL program to copy the image
      let program = disposable.addDisposable(new FimGLProgramCopy(gl));

      // Animation loop
      let clock = Stopwatch.startNew();
      let frameCount = 0;  
      while (true) {
        // Rotate X-axis 360 degrees every 5 seconds, Y-axis every 12 seconds, and Z-axis every 60 seconds
        let twoPIms = Math.PI * 2 * clock.getElapsedMilliseconds();
        let angleX = twoPIms / 5000;
        let angleY = twoPIms / 12000;
        let angleZ = twoPIms / 60000;

        // Calculate the vertex transformation matrix. Note that the operations are applied in reverse order due to the way
        // matrix multiplication works. Translate, then rotate, then scale.
        let matrix = new Transform3D();
        matrix.scale(texture.w, texture.h, texture.w);
        matrix.rotateX(angleX);
        matrix.rotateY(angleY);
        matrix.rotateZ(angleZ);
        matrix.scale(1 / texture.w, 1 / texture.h, 1 / texture.w);

        // Clear any existing image on the WebGL canvas
        gl.fill('#000');

        program.setInputs(texture);
        program.applyVertexMatrix(matrix);
        program.execute();

        // Copy the result to the screen
        let fps = ++frameCount * 1000 / clock.getElapsedMilliseconds();
        let message = `FPS=${fps.toFixed(2)}`;
        await renderOutput(gl, message, null, canvasId);
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
