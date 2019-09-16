// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim, loadTestImage, perfTest, renderOutput, recordPerformanceValue } from '../Common';
import { FimBitsPerPixel, FimGLCanvas, FimGLTexture, FimGLTextureFlags,
  FimGLProgramCopy } from '../../../build/dist/index.js';
import { DisposableSet, usingAsync } from '@leosingleton/commonlibs';

export async function perfGLCopyProgram(): Promise<void> {
  usingAsync(await loadTestImage(), async srcImage => {
    //
    // Test case to copy from various sized textures and canvases
    //
    async function testCopyProgram(id: string, canvasWidth: number, canvasHeight: number, textureWidth: number,
        textureHeight: number, linearSampling: boolean, inputOnly = true): Promise<void> {
      await DisposableSet.usingAsync(async disposable => {
        let flags = FimGLTextureFlags.None;
        flags |= linearSampling ? FimGLTextureFlags.LinearSampling : 0;
        flags |= inputOnly ? FimGLTextureFlags.InputOnly : 0;
        
        let gl = disposable.addDisposable(new FimGLCanvas(fim, canvasWidth, canvasHeight));
        let t = disposable.addDisposable(new FimGLTexture(gl, textureWidth, textureHeight,
          { bpp: FimBitsPerPixel.BPP8, textureFlags: flags }));
        t.copyFrom(srcImage);
        let program = disposable.addDisposable(new FimGLProgramCopy(gl));

        // Run performance test
        let d = `Copy ${textureWidth}x${textureHeight} texture to ${canvasWidth}x${canvasHeight} WebGL canvas\n` +
          `(Sampling=${linearSampling ? 'Linear' : 'Nearest'}, InputOnly=${inputOnly})`;
        let results = perfTest(d, () => {
          program.setInputs(t);
          program.execute();
        })

        // Render output
        await renderOutput(gl, results.message, 360);
        recordPerformanceValue(id, results);
      });
    }

    await testCopyProgram('near-wh-wh', srcImage.w, srcImage.h, srcImage.w, srcImage.h, false);
    await testCopyProgram('near-wh-22', srcImage.w, srcImage.h, 2048, 2048, false);
    await testCopyProgram('near-wh-44', srcImage.w, srcImage.h, 4096, 4096, false);
    await testCopyProgram('near-22-wh', 2048, 2048, srcImage.w, srcImage.h, false);
    await testCopyProgram('near-22-22', 2048, 2048, 2048, 2048, false);
    await testCopyProgram('near-22-44', 2048, 2048, 4096, 4096, false);
    await testCopyProgram('near-44-wh', 4096, 4096, srcImage.w, srcImage.h, false);
    await testCopyProgram('near-44-22', 4096, 4096, 2048, 2048, false);
    await testCopyProgram('near-44-44', 4096, 4096, 4096, 4096, false);

    // Repeat the same cases, but with linear sampling
    await testCopyProgram('linear-wh-wh', srcImage.w, srcImage.h, srcImage.w, srcImage.h, true);
    await testCopyProgram('linear-wh-22', srcImage.w, srcImage.h, 2048, 2048, true);
    await testCopyProgram('linear-wh-44', srcImage.w, srcImage.h, 4096, 4096, true);
    await testCopyProgram('linear-22-wh', 2048, 2048, srcImage.w, srcImage.h, true);
    await testCopyProgram('linear-22-22', 2048, 2048, 2048, 2048, true);
    await testCopyProgram('linear-22-44', 2048, 2048, 4096, 4096, true);
    await testCopyProgram('linear-44-wh', 4096, 4096, srcImage.w, srcImage.h, true);
    await testCopyProgram('linear-44-22', 4096, 4096, 2048, 2048, true);
    await testCopyProgram('linear-44-44', 4096, 4096, 4096, 4096, true);

    // Repeat the first few test cases, with a non-InputOnly texture
    await testCopyProgram('nonio-wh-wh', srcImage.w, srcImage.h, srcImage.w, srcImage.h, false, false);
    await testCopyProgram('nonio-wh-22', srcImage.w, srcImage.h, 2048, 2048, false, false);
    await testCopyProgram('nonio-wh-44', srcImage.w, srcImage.h, 4096, 4096, false, false);
  });
}
