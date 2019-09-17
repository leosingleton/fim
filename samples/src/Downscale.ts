// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim } from './Common';
import { FimCanvas, FimGLTextureFlags, FimGLProgramDownscale, FimTestPatterns, IFimCanvas,
  IFimGLCanvas } from '../../build/dist/index.js';
import { DisposableSet, usingAsync } from '@leosingleton/commonlibs';

export async function downscale(): Promise<void> {
  await DisposableSet.usingAsync(async disposable => {
    // Build the test pattern
    let testBuffer = disposable.addDisposable(fim.createRgbaBuffer(512, 512));
    FimTestPatterns.render(testBuffer, FimTestPatterns.downscaleStress);

    // Copy the test pattern to a canvas and draw it
    let test = disposable.addDisposable(fim.createCanvas(testBuffer.w, testBuffer.h));
    await test.copyFromAsync(testBuffer);
    await renderOutput(test, 'Test Pattern:');

    // Downscale by various ratios
    await testDownscaleWithCanvas(test, 1.5);
    await testDownscaleWithGLCopy(test, 1.5);
    await testDownscaleWithGL(test, 1.5);

    await testDownscaleWithCanvas(test, 2);
    await testDownscaleWithGLCopy(test, 2);
    await testDownscaleWithGL(test, 2);

    await testDownscaleWithCanvas(test, 3);
    await testDownscaleWithGLCopy(test, 3);
    await testDownscaleWithGL(test, 3);

    await testDownscaleWithCanvas(test, 4);
    await testDownscaleWithGLCopy(test, 4);
    await testDownscaleWithGL(test, 4);

    await testDownscaleWithCanvas(test, 6);
    await testDownscaleWithGLCopy(test, 6);
    await testDownscaleWithGL(test, 6);

    await testDownscaleWithCanvas(test, 8);
    await testDownscaleWithGLCopy(test, 8);
    await testDownscaleWithGL(test, 8);

    await testDownscaleWithCanvas(test, 15);
    await testDownscaleWithGLCopy(test, 15);
    await testDownscaleWithGL(test, 15);

    await testDownscaleWithCanvas(test, 16);
    await testDownscaleWithGLCopy(test, 16);
    await testDownscaleWithGL(test, 16);

    await testDownscaleWithCanvas(test, 48);
    await testDownscaleWithGLCopy(test, 48);
    await testDownscaleWithGL(test, 48);
  });
}

function renderOutput(canvas: IFimCanvas | IFimGLCanvas, message: string): void {
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
  canvas.copyTo(output);
}

async function testDownscaleWithCanvas(test: FimCanvas, ratio: number): Promise<void> {
  await usingAsync(fim.createCanvas(test.w / ratio, test.h / ratio), async output => {
    output.copyFrom(test);
    await renderOutput(output, `Downscaled ${ratio}x using FimCanvas.copyFrom():`);
  });
}

async function testDownscaleWithGLCopy(test: FimCanvas, ratio: number): Promise<void> {
  await DisposableSet.usingAsync(async disposable => {
    let output = disposable.addDisposable(fim.createGLCanvas(test.w / ratio, test.h / ratio));

    let flags = FimGLTextureFlags.LinearSampling | FimGLTextureFlags.AllowLargerThanCanvas;
    let input = disposable.addDisposable(output.createTextureFrom(test, flags));
    output.copyFrom(input);

    await renderOutput(output, `Downscaled ${ratio}x using WebGL copy:`);
  });
}

async function testDownscaleWithGL(test: FimCanvas, ratio: number): Promise<void> {
  await DisposableSet.usingAsync(async disposable => {
    let output = disposable.addDisposable(fim.createGLCanvas(test.w / ratio, test.h / ratio));

    let flags = FimGLTextureFlags.LinearSampling | FimGLTextureFlags.AllowLargerThanCanvas;
    let input = disposable.addDisposable(output.createTextureFrom(test, flags));

    let program = disposable.addDisposable(new FimGLProgramDownscale(output, ratio, ratio));
    program.setInputs(input);
    program.execute();

    await renderOutput(output, `Downscaled ${ratio}x using custom WebGL downscale shader:`);
  });
}
