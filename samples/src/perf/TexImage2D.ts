// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loadTestImage, perfTest, renderOutput, textureToCanvas } from '../Common';
import { FimGLCanvas, FimGLTexture, FimGLTextureFlags, FimRgbaBuffer } from '../../../build/dist/index.js';
import { DisposableSet, using, usingAsync } from '@leosingleton/commonlibs';

export async function perfTexImage2D(): Promise<void> {
  await DisposableSet.usingAsync(async disposable => {
    let srcImage = disposable.addDisposable(await loadTestImage());
    let gl = disposable.addDisposable(new FimGLCanvas(512, 512));


    //
    // Test case to create and dispose textures
    //
    async function testCreateTexDispose(width: number, height: number, flags: FimGLTextureFlags): Promise<void> {
      // Run performance test
      let message = perfTest(`Create, texImage2D, and dispose ${width}x${height} textures`, () => {
        using(new FimGLTexture(gl, width, height, flags), t => {
          t.copyFrom(srcImage);
        });
      });

      // Render output. We have to perform the copy an extra time because the test case disposed it.
      await usingAsync(new FimGLTexture(gl, width, height, flags), async t => {
        t.copyFrom(srcImage);
        textureToCanvas(gl, t);
        await renderOutput(gl, message, 360);
      });
    }

    let createTexDisposeFlags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly;
    await testCreateTexDispose(srcImage.w, srcImage.h, createTexDisposeFlags);
    await testCreateTexDispose(2048, 2048, createTexDisposeFlags);
    await testCreateTexDispose(4096, 4096, createTexDisposeFlags);


    //
    // Test case to test texImage2D reusing the same texture
    //
    async function testTex(width: number, height: number, flags: FimGLTextureFlags): Promise<void> {
      await usingAsync(new FimGLTexture(gl, width, height, flags), async t => {
        // Run performance test
        let message = perfTest(`texImage2D ${width}x${height} textures (reuse textures)`, () => {
          t.copyFrom(srcImage);
        });

        // Render output
        textureToCanvas(gl, t);
        await renderOutput(gl, message, 360);
      });
    }

    let texFlags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly;
    await testTex(srcImage.w, srcImage.h, texFlags);
    await testTex(2048, 2048, texFlags);
    await testTex(4096, 4096, texFlags);


    //
    // Test case to test texImage2D from a FimRgbaBuffer (reuse textures)
    //
    async function testTexFromBuffer(width: number, height: number, flags: FimGLTextureFlags): Promise<void> {
      usingAsync(new FimRgbaBuffer(srcImage.w, srcImage.h), async buffer => {
        // Copy the source image to a buffer
        buffer.copyFrom(srcImage);

        await usingAsync(new FimGLTexture(gl, width, height, flags), async t => {
          // Run performance test
          let message = perfTest(`texImage2D ${width}x${height} textures from FimRgbaBuffer (reuse textures)`, () => {
            t.copyFrom(buffer);
          });

          // Render output
          textureToCanvas(gl, t);
          await renderOutput(gl, message, 360);
        });
      });
    }

    let texFromBufferFlags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly;
    await testTexFromBuffer(srcImage.w, srcImage.h, texFromBufferFlags);
    await testTexFromBuffer(2048, 2048, texFromBufferFlags);
    await testTexFromBuffer(4096, 4096, texFromBufferFlags);
  });
}
