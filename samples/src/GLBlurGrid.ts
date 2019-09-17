// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim } from './Common';
import { FimGLProgramMatrixOperation1D, GaussianKernel, ImageGrid } from '../../build/dist/index.js';
import { Stopwatch, TaskScheduler, parseQueryString } from '@leosingleton/commonlibs';

const kernelSize = 31;
const reps = 5;

export async function glBlurGrid(canvasId: string): Promise<void> {
  console.log('Starting WebGL blur sample...');

  // Load a sample JPEG image into a byte array
  let url = 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg';
  let fetchResponse = await fetch(url, { method: 'GET' });
  let jpeg = await fetchResponse.arrayBuffer();

  // Load the JPEG onto a FimCanvas
  let canvas = await fim.createCanvasFromJpegAsync(new Uint8Array(jpeg));

  // Get the output canvas and scale it to the same size as the input
  let output = document.getElementById(canvasId) as HTMLCanvasElement;
  output.width = canvas.w;
  output.height = canvas.h;

  // Determine the tile size from the query string. Default is 2048x2048.
  let qs = parseQueryString();
  let tileSize = qs['size'] ? parseInt(qs['size']) : 2048;
  console.log(`Tile size: ${tileSize}x${tileSize}`);

  // Create a WebGL canvas and program to perform Gaussian blurs. We'll process everything as 2048x2048 tiles,
  // regardless of the input and output dimensions.
  let gl = fim.createGLCanvas(tileSize, tileSize);
  let program = new FimGLProgramMatrixOperation1D(gl, kernelSize);

  // Break the large image into 2048x2048 pieces for processing
  let grid = new ImageGrid(canvas.w, canvas.h, gl.w, gl.h, kernelSize * reps);
  let input = fim.createCanvas(gl.w, gl.h);
  let texture = gl.createTexture();
  console.log(`Tiles=${grid.tiles.length} Efficiency=${grid.getEfficiency()}`);

  // Animation loop
  let clock = Stopwatch.startNew();
  let frameCount = 0;  
  while (true) {
    // Vary the sigma from 0 to 2 every 10 seconds
    let time = clock.getElapsedMilliseconds() % 10000;
    let sigma = (time < 5000) ? time : (10000 - time);
    sigma *= 2 / 5000;

    // Build a Gaussian kernel with the desired sigma
    let kernel = GaussianKernel.calculate(sigma, kernelSize);

    // Operate on the 2048x2048 tiles
    for (let n = 0; n < grid.tiles.length; n++) {
      let tile = grid.tiles[n];

      // Process the event loop between tiles
      await TaskScheduler.yieldAsync();

      // Load the input image onto the texture
      input.copyFrom(canvas, tile.inputFull, tile.inputTile);
      texture.copyFrom(input);

      // Copy texture to texture on subsequent all but the last run
      program.setInputs(texture, kernel);
      for (let n = 0; n < reps - 3; n++) {
        await TaskScheduler.yieldAsync();
        program.execute(texture);
      }
  
      // Copy to the output on the final run
      await TaskScheduler.yieldAsync();
      program.execute();

      // Copy the result to the screen
      let ctx = output.getContext('2d');
      ctx.drawImage(gl.getCanvas(), tile.outputTile.xLeft, tile.outputTile.yTop, tile.outputTile.w, tile.outputTile.h,
        tile.outputFull.xLeft, tile.outputFull.yTop, tile.outputFull.w, tile.outputFull.h);
    }

    let fps = ++frameCount * 1000 / clock.getElapsedMilliseconds();
    console.log(`Rendered frame. FPS=${fps}`);
  }
}
