// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperationShader } from '../api/FimOperationShader';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';
import { FimTextureSampling } from '../api/FimTextureSampling';

/** Built-in operation to perform a matrix operation on an image with a 1D kernel using two passes */
export class FimOpMatrix1D extends FimOperationShader {
  /**
   * Constructor
   * @param fim FIM instance
   * @param fast If set, uses a faster implemenation which is based on sampling every other pixel. Requires that all
   *    inputs and outputs use linear filtering.
   */
  public constructor(fim: Fim, fast = false) {
    const source = fast ? require('../../build/ops/glsl/Matrix1DFast.glsl.js') :
      require('../../build/ops/glsl/Matrix1D.glsl.js');
    const shader = fim.createGLShader(source, undefined, 'Matrix1D');
    super(fim, shader);
  }

  /**
   * Whether the faster implementation is enabled based on sampling every other pixel. Requires that all inputs and
   * outputs use linear filtering.
   */
  public readonly fast: boolean;

  /**
   * Sets the inputs of the shader
   * @param input Input image
   * @param kernel One-dimensional kernel
   */
  public setInputs(input: FimImage, kernel: number[]): void {
    const me = this;

    me.shader.setConstants({
      KERNEL_SIZE: kernel.length
    });
    me.shader.setUniforms({
      uKernel: kernel
    });

    // Set the remaining uniforms later--they vary on the two passes.
    this.inputImage = input;
  }

  /** Input image */
  private inputImage: FimImage;

  public async executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    const me = this;
    const shader = me.shader;
    const inputImage = me.inputImage;

    if (destCoords) {
      // destCoords is not implemented with FimOpMatrix1D
      throw new FimError(FimErrorCode.NotImplemented);
    }

    // Check effective image options and ensure linear filtering is enabled
    if (me.fast) {
      if (inputImage.getEffectiveImageOptions().sampling !== FimTextureSampling.Linear) {
        FimError.throwOnInvalidParameter(`${inputImage.handle} not linear`);
      }
      if (outputImage.getEffectiveImageOptions().sampling !== FimTextureSampling.Linear) {
        FimError.throwOnInvalidParameter(`${outputImage.handle} not linear`);
      }
    }

    // Make the first pass in the X direction
    shader.setUniforms({
      uInput: inputImage,
      uInputSize: [inputImage.imageDimensions.w, inputImage.imageDimensions.h],
      uIsX: 1,
      uIsY: 0
    });
    await outputImage.executeAsync(shader);

    // Make the second pass in the Y direction
    shader.setUniforms({
      uInput: outputImage,
      uInputSize: [outputImage.imageDimensions.w, outputImage.imageDimensions.h],
      uIsX: 0,
      uIsY: 1
    });
    await outputImage.executeAsync(shader);
  }
}
