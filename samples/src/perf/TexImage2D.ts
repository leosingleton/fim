// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim, loadTestImage, perfTest, renderOutput, textureToCanvas, recordPerformanceValue } from '../Common';
import { FimGLTextureFlags } from '../../../build/dist/index.js';
import { DisposableSet, using, usingAsync } from '@leosingleton/commonlibs';

export async function perfTexImage2D(): Promise<void> {
  await DisposableSet.usingAsync(async disposable => {
    const srcImage = disposable.addDisposable(await loadTestImage());
    const gl = disposable.addDisposable(fim.createGLCanvas(512, 512));


    //
    // Test case to create and dispose textures
    //
    async function testCreateTexDispose(id: string, width: number, height: number, flags: FimGLTextureFlags):
        Promise<void> {
      // Run performance test
      const results = perfTest(`Create, texImage2D, and dispose ${width}x${height} textures`, () => {
        using(gl.createTexture(width, height, { textureFlags: flags }), t => {
          t.copyFrom(srcImage);
        });
      });

      // Render output. We have to perform the copy an extra time because the test case disposed it.
      await usingAsync(gl.createTexture(width, height, { textureFlags: flags }), async t => {
        t.copyFrom(srcImage);
        textureToCanvas(gl, t);
        await renderOutput(gl, results.message, 360);
        recordPerformanceValue(id, results);
      });
    }

    const createTexDisposeFlags = FimGLTextureFlags.InputOnly;
    await testCreateTexDispose('ctd-wh', srcImage.w, srcImage.h, createTexDisposeFlags);
    await testCreateTexDispose('ctd-22', 2048, 2048, createTexDisposeFlags);
    await testCreateTexDispose('ctd-44', 4096, 4096, createTexDisposeFlags);


    //
    // Test case to test texImage2D reusing the same texture
    //
    async function testTex(id: string, width: number, height: number, inputOnly: boolean): Promise<void> {
      let flags = FimGLTextureFlags.None;
      flags |= inputOnly ? FimGLTextureFlags.InputOnly : 0;

      await usingAsync(gl.createTexture(width, height, { textureFlags: flags }), async t => {
        // Run performance test
        const results = perfTest(`texImage2D ${width}x${height} textures\n` +
            `(reuse textures, InputOnly=${inputOnly})`, () => {
          t.copyFrom(srcImage);
        });

        // Render output
        textureToCanvas(gl, t);
        await renderOutput(gl, results.message, 360);
        recordPerformanceValue(id, results);
      });
    }

    // Test with a read/write texture
    await testTex('t-wh', srcImage.w, srcImage.h, false);
    await testTex('t-22', 2048, 2048, false);
    await testTex('t-44', 4096, 4096, false);

    // Test with an InputOnly texture
    await testTex('tio-wh', srcImage.w, srcImage.h, true);
    await testTex('tio-22', 2048, 2048, true);
    await testTex('tio-44', 4096, 4096, true);


    //
    // Test case to test texImage2D from a FimRgbaBuffer (reuse textures)
    //
    async function testTexFromBuffer(id: string, width: number, height: number, flags: FimGLTextureFlags):
        Promise<void> {
      await usingAsync(fim.createRgbaBuffer(srcImage.w, srcImage.h), async buffer => {
        // Copy the source image to a buffer
        buffer.copyFrom(srcImage);

        await usingAsync(gl.createTexture(width, height, { textureFlags: flags }), async t => {
          // Run performance test
          const results = perfTest(`texImage2D ${width}x${height} textures from FimRgbaBuffer (reuse textures)`, () => {
            t.copyFrom(buffer);
          });

          // Render output
          textureToCanvas(gl, t);
          await renderOutput(gl, results.message, 360);
          recordPerformanceValue(id, results);
        });
      });
    }

    const texFromBufferFlags = FimGLTextureFlags.InputOnly;
    await testTexFromBuffer('buf-wh', srcImage.w, srcImage.h, texFromBufferFlags);
    await testTexFromBuffer('buf-22', 2048, 2048, texFromBufferFlags);
    await testTexFromBuffer('buf-44', 4096, 4096, texFromBufferFlags);
  });
}
