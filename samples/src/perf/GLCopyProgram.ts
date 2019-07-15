// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { loadTestImage, perfTest, renderOutput } from '../Common';
import { FimGLCanvas, FimGLTexture, FimGLTextureFlags, FimGLProgramCopy } from '../../../build/dist/index.js';
import { DisposableSet, usingAsync } from '@leosingleton/commonlibs';

export async function perfGLCopyProgram(): Promise<void> {
  usingAsync(await loadTestImage(), async srcImage => {
    //
    // Test case to copy from various sized textures and canvases
    //
    async function testCopyProgram(canvasWidth: number, canvasHeight: number, textureWidth: number,
        textureHeight: number, linearSampling: boolean, suppressOutput = false): Promise<void> {
      await DisposableSet.usingAsync(async disposable => {
        let flags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly;
        flags |= linearSampling ? FimGLTextureFlags.LinearSampling : 0;
        
        let gl = disposable.addDisposable(new FimGLCanvas(canvasWidth, canvasHeight));
        let t = disposable.addDisposable(new FimGLTexture(gl, textureWidth, textureHeight, flags));
        t.copyFrom(srcImage);
        let program = disposable.addDisposable(new FimGLProgramCopy(gl));

        // Run performance test
        let d = `Copy ${textureWidth}x${textureHeight} texture to ${canvasWidth}x${canvasHeight} WebGL canvas ` +
          `(Sampling=${linearSampling ? 'Linear' : 'Nearest'})`;
        let message = perfTest(d, () => {
          program.setInputs(t);
          program.execute();
        })

        if (!suppressOutput) {
          // Render output
          await renderOutput(gl, message, undefined, 512, 512);
        }
      });
    }

    // We do a dummy run first, as the first run is significantly slower. We're creating a new texture and program each
    // time, so probably not the texture cache. However, there's definitely some optimization on subsequent runs.
    await testCopyProgram(4096, 4096, 4096, 4096, false, true);
    await testCopyProgram(srcImage.w, srcImage.h, srcImage.w, srcImage.h, false);
    await testCopyProgram(srcImage.w, srcImage.h, 2048, 2048, false);
    await testCopyProgram(srcImage.w, srcImage.h, 4096, 4096, false);
    await testCopyProgram(2048, 2048, srcImage.w, srcImage.h, false);
    await testCopyProgram(2048, 2048, 2048, 2048, false);
    await testCopyProgram(2048, 2048, 4096, 4096, false);
    await testCopyProgram(4096, 4096, srcImage.w, srcImage.h, false);
    await testCopyProgram(4096, 4096, 2048, 2048, false);
    await testCopyProgram(4096, 4096, 4096, 4096, false);

    // Repeat the same cases, but with linear sampling
    await testCopyProgram(4096, 4096, 4096, 4096, true, true);
    await testCopyProgram(srcImage.w, srcImage.h, srcImage.w, srcImage.h, true);
    await testCopyProgram(srcImage.w, srcImage.h, 2048, 2048, true);
    await testCopyProgram(srcImage.w, srcImage.h, 4096, 4096, true);
    await testCopyProgram(2048, 2048, srcImage.w, srcImage.h, true);
    await testCopyProgram(2048, 2048, 2048, 2048, true);
    await testCopyProgram(2048, 2048, 4096, 4096, true);
    await testCopyProgram(4096, 4096, srcImage.w, srcImage.h, true);
    await testCopyProgram(4096, 4096, 2048, 2048, true);
    await testCopyProgram(4096, 4096, 4096, 4096, true);
  });
}
