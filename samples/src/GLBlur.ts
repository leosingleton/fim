// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim, loadTestImage, renderOutput } from './Common';
import { FimCanvas, FimGLProgramMatrixOperation1D, GaussianKernel, FimGLImageProcessor, FimGLTextureFlags,
  IFimGLCanvas } from '../../build/dist/index.js';
import { Stopwatch, TaskScheduler, DisposableSet } from '@leosingleton/commonlibs';

const kernelSize = 31;
const reps = 5;

const enum ObjectIDs {
  InputTexture,
  BlurProgram
}

class BlurImageProcessor extends FimGLImageProcessor {
  public constructor(input: FimCanvas) {
    super(fim, input.w, input.h);

    // Create a preserved texture with a sample JPEG image
    let inputTexture = this.getPreservedTexture(ObjectIDs.InputTexture, input.w, input.h,
      { textureFlags: FimGLTextureFlags.InputOnly });
    inputTexture.copyFrom(input);
    inputTexture.preserve();
  }

  public async render(sigma: number): Promise<IFimGLCanvas> {
    // Cannot render if WebGL context is lost
    if (this.glCanvas.isContextLost()) {
      return null;
    }

    try {
      // Build a Gaussian kernel with the desired sigma
      let kernel = GaussianKernel.calculate(sigma, kernelSize);

      // Get the input texture and blur program
      let texture = this.getPreservedTexture(ObjectIDs.InputTexture);
      let program = this.getProgram(ObjectIDs.BlurProgram, gl => new FimGLProgramMatrixOperation1D(gl, kernelSize));

      // Execute the blur program 5 times for a larger blur effect
      await DisposableSet.usingAsync(async disposable => {
        // Allocate two temporary textures
        let temp1 = disposable.addDisposable(this.temporaryTextures.getTexture());
        let temp2 = disposable.addDisposable(this.temporaryTextures.getTexture());

        // Use the input texture on the first run
        program.setInputs(texture, kernel, temp2);
        program.execute(temp1);

        // Copy temp to temp on subsequent runs
        await TaskScheduler.yieldAsync();
        program.setInputs(temp1, kernel, temp2);
        for (let n = 0; n < reps - 2; n++) {
          program.execute(temp1);
        }

        // Copy to the output on the final run
        await TaskScheduler.yieldAsync();
        program.execute();
      });

      return this.glCanvas;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

export async function glBlur(canvasId: string): Promise<void> {
  // Load a sample JPEG image
  let canvas = await loadTestImage();

  // Animation loop
  let clock = Stopwatch.startNew();
  let frameCount = 0;  
  let processor = new BlurImageProcessor(canvas);
  canvas.dispose();

  async function renderFrame(): Promise<void> {
    // Vary the sigma from 0 to 2 every 10 seconds
    let time = clock.getElapsedMilliseconds() % 10000;
    let sigma = (time < 5000) ? time : (10000 - time);
    sigma *= 2 / 5000;

    // Render one frame
    let output = await processor.render(sigma);

    // Copy the result to the screen
    if (output) {
      let fps = ++frameCount * 1000 / clock.getElapsedMilliseconds();
      let message = `Frame=${frameCount} FPS=${fps.toFixed(2)}`;
      renderOutput(output, message, null, canvasId);
    }

    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);
}
