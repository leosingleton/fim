// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loadTestImage, handleError, renderOutput } from './Common';
import { FimGLCanvas, FimGLTexture, FimGLProgramCopy, FimGLTextureFlags,
  Transform2D } from '../../build/dist/index.js';
import { DisposableSet, Stopwatch, Task } from '@leosingleton/commonlibs';

export async function glTransform2D(canvasId: string): Promise<void> {
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
        // Rotate 360 degrees every 5 seconds
        let angle = Math.PI * 2 * clock.getElapsedMilliseconds() / 5000;

        // Scale to 10% and back every 30 seconds
        let scale = (clock.getElapsedMilliseconds() % 30000) / 15000;
        if (scale > 1) {
          scale = 2 - scale;
        }
        if (scale < 0.1) {
          scale = 0.1;
        }

        // Translate in a square every 10 seconds
        let tx: number, ty: number;
        let translate = (clock.getElapsedMilliseconds() % 10000) / 2500;
        if (translate > 3) {
          tx = -0.5;
          ty = 0.5 - (translate - 3);
        } else if (translate > 2) {
          tx = 0.5 - (translate - 2);
          ty = 0.5;
        } else if (translate > 1) {
          tx = 0.5;
          ty = (translate - 1) - 0.5;
        } else {
          tx = translate - 0.5;
          ty = -0.5;
        }

        // Calculate the vertex transformation matrix. Note that the operations are applied in reverse order due to the way
        // matrix multiplication works. Translate, then rotate, then scale.
        let matrix = new Transform2D();
        matrix.scale(texture.w, texture.h);
        matrix.scale(scale, scale);
        matrix.rotate(angle);
        matrix.translate(tx * texture.w, ty * texture.h);
        matrix.scale(1 / texture.w, 1 / texture.h);

        // Clear any existing image on the WebGL canvas
        gl.fillCanvas('#000');

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
      await Task.delayAsync(1000);
    }
  }
}
