import { getAnimationValue, measureFrameStart, measureFrameStop, renderDetails } from './Common';
import { UnhandledError } from '@leosingleton/commonlibs';
import { FimDimensions, FimOpUnsharpMask } from '@leosingleton/fim';
import { FimBrowserFactory } from '@leosingleton/fim-browser';

export async function unsharpMaskSample(): Promise<void> {
  // Initialize the global FIM instance
  const fim = FimBrowserFactory.create(FimDimensions.fromWidthHeight(1920, 1080));

  // Load the sample image
  const url = 'https://www.leosingleton.com/sample-images/point-lobos.jpg';
  const inputImage = await fim.createImageFromJpegFileAsync(url, { backup: true, bpp: 8, glReadOnly: true });

  // Create the unsharp mask operation
  const usmOperation = new FimOpUnsharpMask(fim, true);

  // Create the output image
  const outputImage = fim.createImage({}, inputImage.dim, 'outputImage');

  // Get and scale the output canvas
  const canvas = $('#output').get(0) as HTMLCanvasElement;
  canvas.width = outputImage.dim.w;
  canvas.height = outputImage.dim.h;

  // Start the animation loop
  requestAnimationFrame(renderOneFrame);

  async function renderOneFrame() {
    try {
      // Cycle back and forth every 10 seconds
      const amount = getAnimationValue(10000);

      measureFrameStart();

      // Apply the unsharp mask operation
      usmOperation.setInputs(inputImage, amount, 1);
      await outputImage.executeAsync(usmOperation);

      // Copy the result to the screen
      await outputImage.exportToCanvasAsync(canvas);

      measureFrameStop();

      // Write additional details to the screen
      renderDetails(fim, canvas, `Unsharp Mask Amount: ${amount.toFixed(3)} Sigma: 1.0`);
    } catch (err) {
      UnhandledError.reportError(err);
    }

    // Render the next frame of the animation loop
    requestAnimationFrame(renderOneFrame);
  }
}
