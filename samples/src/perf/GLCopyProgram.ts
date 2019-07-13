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
        textureHeight: number, flags: FimGLTextureFlags): Promise<void> {
      await DisposableSet.usingAsync(async disposable => {
        let gl = disposable.addDisposable(new FimGLCanvas(canvasWidth, canvasHeight));
        let t = disposable.addDisposable(new FimGLTexture(gl, textureWidth, textureHeight, flags));
        t.copyFrom(srcImage);
        let program = disposable.addDisposable(new FimGLProgramCopy(gl));

        // Run performance test
        let d = `Copy ${textureWidth}x${textureHeight} texture to ${canvasWidth}x${canvasHeight} WebGL canvas`;
        let message = perfTest(d, () => {
          program.setInputs(t);
          program.execute();
        })

        // Render output
        await renderOutput(gl, message);
      });
    }

    let copyProgramFlags = FimGLTextureFlags.EightBit | FimGLTextureFlags.InputOnly;
    await testCopyProgram(srcImage.w, srcImage.h, srcImage.w, srcImage.h, copyProgramFlags);
    await testCopyProgram(srcImage.w, srcImage.h, 2048, 2048, copyProgramFlags);
    await testCopyProgram(srcImage.w, srcImage.h, 4096, 4096, copyProgramFlags);
    await testCopyProgram(2048, 2048, srcImage.w, srcImage.h, copyProgramFlags);
    await testCopyProgram(2048, 2048, 2048, 2048, copyProgramFlags);
    await testCopyProgram(2048, 2048, 4096, 4096, copyProgramFlags);
    await testCopyProgram(4096, 4096, srcImage.w, srcImage.h, copyProgramFlags);
    await testCopyProgram(4096, 4096, 2048, 2048, copyProgramFlags);
    await testCopyProgram(4096, 4096, 4096, 4096, copyProgramFlags);
  });
}
