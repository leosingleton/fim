// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, FimGLCanvas, FimGLTexture, FimGLTextureFlags, FimGLProgramCopy,
  FimRgbaBuffer } from '../../build/dist/index.js';
import { DisposableSet, Stopwatch, TaskScheduler, using, usingAsync } from '@leosingleton/commonlibs';

export async function texImage2DPerformance(): Promise<void> {
  console.log('Starting texImage2D performance tests...');

  let disposable = new DisposableSet();

  // Load a sample JPEG image into a byte array
  let url = 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg';
  let fetchResponse = await fetch(url, { method: 'GET' });
  let jpeg = await fetchResponse.arrayBuffer();
  
  // Decode the JPEG image onto a canvas
  let srcImage = disposable.addDisposable(await FimCanvas.createFromJpeg(new Uint8Array(jpeg)));

  // Create a WebGL canvas
  let gl = disposable.addDisposable(new FimGLCanvas(512, 512));

  // Helper function to display the results of a test case
  async function displayResult(message: string): Promise<void> {
    console.log(message);

    // Create a canvas on the DOM
    let output = document.createElement('canvas');
    output.width = gl.w;
    output.height = gl.h;

    // Copy the WebGL canvas to the DOM one
    let ctx = output.getContext('2d');
    ctx.drawImage(gl.getCanvas(), 0, 0);

    // Overlay text
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillText(message, 8, 8);
    ctx.restore();

    document.body.appendChild(output);

    // Give the browser time to render
    await TaskScheduler.yield();
  }

  // Test case to create and dispose textures
  async function testCreate(width: number, height: number, flags: FimGLTextureFlags): Promise<void> {
    let timer = Stopwatch.startNew();
    for (let n = 0; n < 100; n++) {
      using(new FimGLTexture(gl, width, height, flags), t => {
        t.copyFrom(srcImage);
      });
    }    
    let message = `Create and texImage2D 100 ${width}x${height} textures in ${timer.getElapsedMilliseconds()} ms`;

    // Render to the WebGL canvas for debugging. This is hidden, but can be seen in the browser's debugging tools if
    // you step through and enable the CSS visible property.
    await usingAsync(new FimGLTexture(gl, width, height, flags), async t => {
      t.copyFrom(srcImage);
      using(new FimGLProgramCopy(gl), copy => {
        copy.setInputs(t);
        copy.execute();
      });

      await displayResult(message);
    });
  }

  await testCreate(srcImage.w, srcImage.h, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);
  await testCreate(2048, 2048, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);
  await testCreate(4096, 4096, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);

  async function testCopy(width: number, height: number, flags: FimGLTextureFlags): Promise<void> {
    let timer = Stopwatch.startNew();
    await usingAsync(new FimGLTexture(gl, width, height, flags), async t => {
      for (let n = 0; n < 100; n++) {
        t.copyFrom(srcImage);
      }
      let message = `texImage2D 100 ${width}x${height} textures in ${timer.getElapsedMilliseconds()} ms`;

      using(new FimGLProgramCopy(gl), copy => {
        copy.setInputs(t);
        copy.execute();
      });

      await displayResult(message);
    });
  }

  await testCopy(srcImage.w, srcImage.h, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);
  await testCopy(2048, 2048, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);
  await testCopy(4096, 4096, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);

  async function testCopyFromBuffer(width: number, height: number, flags: FimGLTextureFlags): Promise<void> {
    usingAsync(new FimRgbaBuffer(srcImage.w, srcImage.h), async buffer => {
      // Copy the source image to a buffer
      buffer.copyFrom(srcImage);

      let timer = Stopwatch.startNew();
      await usingAsync(new FimGLTexture(gl, width, height, flags), async t => {
        for (let n = 0; n < 100; n++) {
          t.copyFrom(buffer);
        }
        let message = `texImage2D 100 ${width}x${height} textures from buffers in ${timer.getElapsedMilliseconds()} ms`;
  
        using(new FimGLProgramCopy(gl), copy => {
          copy.setInputs(t);
          copy.execute();
        });

        await displayResult(message);
      });
    });
  }

  await testCopyFromBuffer(srcImage.w, srcImage.h, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);
  await testCopyFromBuffer(2048, 2048, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);
  await testCopyFromBuffer(4096, 4096, FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly);
}
