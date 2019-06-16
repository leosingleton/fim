// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from '../../build/dist/index.js';
import { Stopwatch, TaskScheduler, using } from '@leosingleton/commonlibs';

export async function jpegLoadStress(canvasId: string): Promise<void> {
  console.log('Starting JPEG load stress test...');

  // Load a sample JPEG image into a byte array
  let url = '/test.jpg';
  let fetchResponse = await fetch(url, { method: 'GET' });
  let jpeg = await fetchResponse.arrayBuffer();
  
  // Get the output canvas
  let output = document.getElementById(canvasId) as HTMLCanvasElement;
  
  // Animation loop
  let frameCount = 0;
  let totalTime = 0;
  while (true) {
    await TaskScheduler.yield();

    // Load the JPEG onto a FimCanvas
    let timer = Stopwatch.startNew();
    let canvas = await FimCanvas.createFromJpeg(new Uint8Array(jpeg));
    let decodeTime = timer.getElapsedMilliseconds();
    totalTime += decodeTime;

    await TaskScheduler.yield();

    // Write the status
    let status = 'Decoded ' + (++frameCount) + ' JPEGs. Average = ' +
      Math.floor(totalTime / frameCount) + ' ms';
    console.log(status);
    using(canvas.createDrawingContext(false, 'difference', 1), ctx => {
      ctx.fillStyle = '#fff';
      ctx.fillText(status, 8, 8);
    });

    // Copy the result to the screen
    output.width = canvas.w;
    output.height = canvas.h;  
    let ctx = output.getContext('2d');
    ctx.drawImage(canvas.getCanvas(), 0, 0);
    
    canvas.dispose();
  }
}
