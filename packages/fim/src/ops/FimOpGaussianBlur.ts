// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimOpMatrix1D } from './FimOpMatrix1D';
import { FimImage } from '../api/FimImage';
import { FimObject } from '../api/FimObject';
import { FimOperation } from '../api/FimOperation';
import { FimGaussianKernel } from '../math/FimGaussianKernel';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to perform a Gaussian blur */
export class FimOpGaussianBlur extends FimOperation {
  /**
   * Constructor
   * @param parent Parent object
   * @param fast If set, uses a faster implemenation which is based on sampling every other pixel. Requires that all
   *    inputs and outputs use linear filtering.
   */
  public constructor(parent: FimObject, fast = false) {
    super(parent, 'GaussianBlur');
    this.matrix1D = new FimOpMatrix1D(this, fast);
  }

  /** Internally, this operation is implemented with the Matrix1D shader */
  private readonly matrix1D: FimOpMatrix1D;

  /**
   * Sets the inputs to the Gaussian blur operation. Returns `this` so the operation may be run in a one-line call to
   * `FimImage.executeAsync()`.
   * @param input Input image
   * @param sigma Standard deviation
   * @param kernelSize Number of elements in the Gaussian kernel. Must be an odd number. Defaults to ~6x the sigma.
   * @returns `this`
   */
  public $(input: FimImage, sigma: number, kernelSize?: number): this {
    // Calculate and set the Gaussian kernel
    const kernel = FimGaussianKernel.calculate(sigma, kernelSize);
    this.matrix1D.$(input, kernel);

    return this;
  }

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return this.matrix1D.executeAsync(outputImage, destCoords);
  }
}
