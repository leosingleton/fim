import { Stopwatch, UnhandledError } from '@leosingleton/commonlibs';
import { FimOpUnsharpMask } from '@leosingleton/fim';
import { FimBrowserFactory } from '@leosingleton/fim-browser';

export async function unsharpMaskSample(): Promise<void> {
  // Initialize the global FIM instance
  const fim = FimBrowserFactory.create();

  // Load the sample image
  const url = 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg';
  const fetchResponse = await fetch(url, { method: 'GET' });
  const jpeg = await fetchResponse.arrayBuffer();
  console.log(jpeg.byteLength);
  const inputImage = await fim.createImageFromJpegAsync(new Uint8Array(jpeg));

  // Create the unsharp mask operation
  const usmOperation = new FimOpUnsharpMask(fim, true);

  // Create the output image
  const outputImage = fim.createImage({}, inputImage.dim);

  // Get and scale the output canvas
  const canvas = $('#output').get(0) as HTMLCanvasElement;
  canvas.width = outputImage.dim.w;
  canvas.height = outputImage.dim.h;

  // Start the animation loop
  const stopwatch = Stopwatch.startNew();
  requestAnimationFrame(renderOneFrame);

  async function renderOneFrame() {
    try {
      // Cycle back and forth every 10 seconds
      let amount = (stopwatch.getElapsedMilliseconds() % 10000) / 10000;
      if (amount > 0.5) {
        amount = 1 - amount;
      }

      // Apply the unsharp mask operation
      usmOperation.setInputs(inputImage, amount, 1);
      await outputImage.executeAsync(usmOperation);

      // Copy the result to the screen
      await outputImage.exportToCanvasAsync(canvas);
    } catch (err) {
      UnhandledError.reportError(err);
    }

    // Render the next frame of the animation loop
    requestAnimationFrame(renderOneFrame);
  }
}
