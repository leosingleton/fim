// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, FimRgbaBuffer, FimColor, FimGLCanvas } from '../../build/dist/index.js';
import { DisposableSet, usingAsync } from '@leosingleton/commonlibs';

export async function downscale(): Promise<void> {
  await DisposableSet.usingAsync(async disposable => {
    // Build the test pattern
    let testBuffer = disposable.addDisposable(new FimRgbaBuffer(512, 512));
    for (let x = 0; x < testBuffer.w; x++) {
      let color = '#fff';
      switch (x % 4) {
        case 0: color = '#f00'; break;
        case 1: color = '#0f0'; break;
        case 2: color = '#00f'; break;
      }

      for (let y = 0; y < testBuffer.h; y++) {
        testBuffer.setPixel(x, y, FimColor.fromString(color));
      }
    }

    // Copy the test pattern to a canvas and draw it
    let test = disposable.addDisposable(new FimCanvas(testBuffer.w, testBuffer.h));
    await test.copyFromAsync(testBuffer);
    await renderOutput(test, 'Test Pattern:');

    // Downscale by various ratios
    await testDownscaleWithCanvas(test, 1.5);
    await testDownscaleWithCanvas(test, 2);
    await testDownscaleWithCanvas(test, 3);
    await testDownscaleWithCanvas(test, 4);
    await testDownscaleWithCanvas(test, 6);
    await testDownscaleWithCanvas(test, 8);
    await testDownscaleWithCanvas(test, 15);
    await testDownscaleWithCanvas(test, 16);
  });
}

function renderOutput(canvas: FimCanvas | FimGLCanvas, message: string): void {
  // Write the message
  let text = document.createElement('p');
  text.innerText = message;
  document.body.appendChild(text);

  // Get the output canvas and scale it to the desired size
  let output = document.createElement('canvas');
  document.body.appendChild(output);
  output.width = canvas.w;
  output.height = canvas.h;

  // Copy the input canvas to the DOM one
  canvas.toHtmlCanvas(output);
}

async function testDownscaleWithCanvas(test: FimCanvas, ratio: number): Promise<void> {
  await usingAsync(new FimCanvas(test.w / ratio, test.h / ratio), async output => {
    output.copyFrom(test);
    await renderOutput(output, `Downscaled ${ratio}x using FimCanvas.copyFrom():`);
  });
}
