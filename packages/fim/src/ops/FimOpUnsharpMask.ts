// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpMatrix1D } from './FimOpMatrix1D';
import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperation } from '../api/FimOperation';
import { FimGaussianKernel } from '../math/FimGaussianKernel';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to apply an unsharp mask to an image */
export class FimOpUnsharpMask extends FimOperation {
  /**
   * Constructor
   * @param fim FIM instance
   * @param fast If set, uses a faster implemenation which is based on sampling every other pixel. Requires that all
   *    inputs and outputs use linear filtering.
   */
  public constructor(fim: Fim, fast = false) {
    super(fim, 'UnsharpMask');
    this.matrix1D = new FimOpMatrix1D(fim, fast);
    this.registerChildObject(this.matrix1D);
  }

  private readonly matrix1D: FimOpMatrix1D;

  /**
   * Sets the inputs of the unsharp mask shader
   * @param input Input image
   * @param amount Amount to sharpen (0 = none; 1 = maximum)
   * @param sigma Standard deviation
   * @param kernelSize Number of elements in the Gaussian kernel. Must be an odd number. Defaults to ~6x the sigma.
   */
  public setInputs(input: FimImage, amount: number, sigma: number, kernelSize?: number): void {
    // General guidance is 3x the standard deviation in each direction, so 6x total. And make it odd.
    if (!kernelSize) {
      kernelSize = Math.floor((sigma * 6) / 2) * 2 + 1;
    }

    // Calculate the Gaussian kernel
    const kernel = FimGaussianKernel.calculate(sigma, kernelSize);

    // Invert and scale kernel
    for (let n = 0; n < kernelSize; n++) {
      kernel[n] = -kernel[n] * amount;
    }

    // The kernel now sums to -amount. Add the original image back in to bring the sum of the kernel back to 1.
    kernel[Math.floor(kernelSize / 2)] += 1 + amount;

    // Set the inputs on the 1D matrix operation
    this.matrix1D.setInputs(input, kernel);
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.matrix1D.executeAsync(outputImage, destCoords);
  }
}
