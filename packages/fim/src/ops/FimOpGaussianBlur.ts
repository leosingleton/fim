// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpMatrix1D } from './FimOpMatrix1D';
import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperation } from '../api/FimOperation';
import { FimGaussianKernel } from '../math/FimGaussianKernel';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to perform a Gaussian blur */
export class FimOpGaussianBlur extends FimOperation {
  /**
   * Constructor
   * @param fim FIM instance
   * @param fast If set, uses a faster implemenation which is based on sampling every other pixel. Requires that all
   *    inputs and outputs use linear filtering.
   */
  public constructor(fim: Fim, fast = false) {
    super(fim, 'GaussianBlur');
    this.matrix1D = new FimOpMatrix1D(fim, fast);
    this.registerChildObject(this.matrix1D);
  }

  /** Internally, this operation is implemented with the Matrix1D shader */
  private readonly matrix1D: FimOpMatrix1D;

  /**
   * Sets the inputs to the Gaussian blur operation
   * @param input Input image
   * @param sigma Standard deviation
   * @param kernelSize Number of elements in the Gaussian kernel. Must be an odd number. Defaults to ~6x the sigma.
   */
  public setInputs(input: FimImage, sigma: number, kernelSize?: number): void {
    // General guidance is 3x the standard deviation in each direction, so 6x total. And make it odd.
    if (!kernelSize) {
      kernelSize = Math.floor((sigma * 6) / 2) * 2 + 1;
    }

    // Calculate and set the Gaussian kernel
    const kernel = FimGaussianKernel.calculate(sigma, kernelSize);
    this.matrix1D.setInputs(input, kernel);
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.matrix1D.executeAsync(outputImage, destCoords);
  }
}
