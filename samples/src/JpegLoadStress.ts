// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim } from './Common';
import { Stopwatch, TaskScheduler, using } from '@leosingleton/commonlibs';

export async function jpegLoadStress(canvasId: string): Promise<void> {
  console.log('Starting JPEG load stress test...');

  // Load a sample JPEG image into a byte array
  const url = 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg';
  const fetchResponse = await fetch(url, { method: 'GET' });
  const jpeg = await fetchResponse.arrayBuffer();

  // Get the output canvas
  const output = document.getElementById(canvasId) as HTMLCanvasElement;

  // Animation loop
  let frameCount = 0;
  let totalTime = 0;
  while (true) {
    await TaskScheduler.yieldAsync();

    // Load the JPEG onto a FimCanvas
    const timer = Stopwatch.startNew();
    const canvas = await fim.createCanvasFromJpegAsync(new Uint8Array(jpeg));
    const decodeTime = timer.getElapsedMilliseconds();
    totalTime += decodeTime;

    await TaskScheduler.yieldAsync();

    // Write the status
    const status = `Decoded ${++frameCount} JPEGs. Average = ${Math.floor(totalTime / frameCount)} ms`;
    console.log(status);
    using(canvas.createDrawingContext(false, 'difference', 1), ctx => {
      ctx.fillStyle = '#fff';
      ctx.fillText(status, 8, 8);
    });

    // Copy the result to the screen
    output.width = canvas.w;
    output.height = canvas.h;
    const ctx = output.getContext('2d');
    ctx.drawImage(canvas.getCanvas(), 0, 0);

    canvas.dispose();
  }
}
