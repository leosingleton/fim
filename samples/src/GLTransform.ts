// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, FimGLCanvas, FimGLTexture, FimGLProgramCopy, FimGLTextureFlags,
  Transform2D } from '../../build/dist/index.js';
import { Stopwatch, TaskScheduler } from '@leosingleton/commonlibs';

export async function glTransform(canvasId: string): Promise<void> {
  console.log('Starting WebGL image transformation sample...');

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
  let texture = FimGLTexture.createFrom(gl, canvas, FimGLTextureFlags.LinearSampling);

  // Create a WebGL program to copy the image
  let program = new FimGLProgramCopy(gl);

  // Animation loop
  let clock = Stopwatch.startNew();
  let frameCount = 0;  
  while (true) {
    await TaskScheduler.yield();

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
    matrix.scale(scale, scale);
    matrix.rotate(angle);
    matrix.translate(tx, ty);

    // Clear any existing image on the WebGL canvas
    gl.fill('#000');

    program.setInputs(texture);
    program.applyVertexMatrix(matrix);
    program.execute();

    // Copy the result to the screen
    let ctx = output.getContext('2d');
    ctx.drawImage(gl.getCanvas(), 0, 0);

    let fps = ++frameCount * 1000 / clock.getElapsedMilliseconds();
    console.log(`Rendered frame. FPS=${fps}`);
  }
}
