// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, FimGLCanvas, FimGLTexture, FimGLProgramMatrixOperation1D, GaussianKernel }
  from '../../build/dist/index.js';
import { Stopwatch, TaskScheduler, usingAsync } from '@leosingleton/commonlibs';

const kernelSize = 31;

export async function glBlur(canvasId: string): Promise<void> {
  console.log('Starting WebGL blur sample...');

  // Load a sample JPEG image into a byte array
  let url = 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg';
  let fetchResponse = await fetch(url, { method: 'GET' });
  let jpeg = await fetchResponse.arrayBuffer();

  // Load the JPEG onto a FimCanvas
  let canvas = await FimCanvas.createFromJpeg(new Uint8Array(jpeg));

  // Get the output canvas and scale it to the same size as the input
  let output = document.getElementById(canvasId) as HTMLCanvasElement;
  output.width = canvas.w;
  output.height = canvas.h;

  // Create a WebGL canvas and texture containing the sample image
  let gl = new FimGLCanvas(canvas.w, canvas.h);
  let texture = FimGLTexture.createFromCanvas(gl, canvas);

  // Create a WebGL program to perform Gaussian blurs
  let program = new FimGLProgramMatrixOperation1D(gl, kernelSize);

  // Animation loop
  let clock = Stopwatch.startNew();
  while (true) {
    await TaskScheduler.yield();
    console.log('Rendering frame');

    // Vary the sigma from 0 to 2 every 10 seconds
    let time = clock.getElapsedMilliseconds() % 10000;
    let sigma = (time < 5000) ? time : (10000 - time);
    sigma *= 2 / 5000;

    // Build a Gaussian kernel with the desired sigma
    let kernel = GaussianKernel.calculate(sigma, kernelSize);

    // Execute the blur program 5 times for a larger blur effect
    await usingAsync(new FimGLTexture(gl), async temp => {
      // Use the input texture on the first run
      program.setInputs(texture, kernel);
      program.execute(temp);

      // Copy temp to temp on subsequent runs
      await TaskScheduler.yield();
      program.setInputs(temp, kernel);
      for (let n = 0; n < 3; n++) {
        program.execute(temp);
      }
  
      // Copy to the output on the final run
      await TaskScheduler.yield();
      program.execute();
    });

    // Copy the result to the screen
    let ctx = output.getContext('2d');
    ctx.drawImage(gl.getCanvas(), 0, 0);
  }
}
