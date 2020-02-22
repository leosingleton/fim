// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimError, FimErrorCode } from '../primitives/FimError';

/**
 * Calculates Gaussian Kernel matrices. Useful for Gaussian Blur filters.
 */
export class FimGaussianKernel {
  /**
   * Returns the value of a Gaussian function at point x with a standard deviation provided by sigma. For performance,
   * the height of the function is not scaled, since we assume a final normalization step will cancel it out anyway.
   * @param x Function input
   * @param t Variance (sigma^2)
   *
   * @see https://en.wikipedia.org/wiki/Gaussian_function
   */
  private static gaussianFunction(x: number, t: number): number {
    return Math.exp(-x * x / (t * 2));
  }

  /**
   * Estimates the integral of f(x) from a to b using Simpson's Rule
   * @param f Function to integrate
   * @param a Lower bound
   * @param b Upper bound
   * @param samples Number of samples to calculate for better accuracy
   *
   * @see https://en.wikipedia.org/wiki/Simpson%27s_rule
   */
  private static simpsonsRule(f: (x: number) => number, a: number, b: number, samples: number): number {
    // Pre-calculate some common constants we'll need repetitively
    const sampleSize = (b - a) / samples;
    const halfSampleSize = sampleSize / 2;

    //
    // Simpson's Rule:
    //                        b - a  [           ( a + b )        ]
    // Integral( f(x) dx ) = ------- [ f(a) + 4 f(-------) + f(b) ]
    //  a -> b                  6    [           (   2   )        ]
    //
    // To reuse as many calculatations as possible, we refer to f(a) as left, f(b) as right, and f((a+b)/2) as mid.
    // First calculate the part in brackets, then we'll multiply by the (b-a)/6 term at the end.
    //
    let left = a;
    let leftValue = f(a);
    let sum = 0;

    for (let n = 0; n < samples; n++) {
      const mid = left + halfSampleSize;
      const midValue = f(mid);
      const right = left + sampleSize;
      const rightValue = f(right);

      sum += leftValue + (midValue * 4) + rightValue;

      left = right; // Reuse right as the next left
      leftValue = rightValue;
    }

    return sum * sampleSize / 6;
  }

  /**
   * Calculates a 1-dimensional Gaussian kernel
   * @param sigma Standard deviation
   * @param kernelSize Number of elements in the kernel
   * @param samples Number of samples to use when calculating each element in the kernel
   * @param quantize
   */
  public static calculate(sigma: number, kernelSize: number, samples = 100, quantize = true): number[] {
    // Cache kernels once they are calculated, as we frequently reuse the same ones, and they are expensive to compute
    const kernelName = `${sigma}:${kernelSize}:${samples}:${quantize ? 'Q' : '-'}`;
    let kernel = this.kernelCache[kernelName];
    if (kernel) {
      return kernel;
    }

    // Ensure kernelSize is odd and large enough
    if (kernelSize % 2 !== 1 || kernelSize < 3) {
      throw new FimError(FimErrorCode.InvalidParameter, `Invalid kernel size ${kernelSize}`);
    }
    const halfKernelSize = Math.floor(kernelSize / 2);

    // Build the Gaussian function as a lambda
    const t = sigma * sigma;
    const f = (x: number) => {
      return this.gaussianFunction(x, t);
    };

    // We know Gaussian distributions are symmetric, so can save a lot of time by only calculating half the kernel and
    // mirroring the values on the other size. Start by calculating the center element, which is special, since it's
    // the positive half times two.
    kernel = [];
    const centerValue = this.simpsonsRule(f, 0, 0.5, samples / 2) * 2;
    kernel[halfKernelSize] = centerValue;

    // Next, calculate the remaining elements
    for (let n = 1; n <= halfKernelSize; n++) {
      const value = this.simpsonsRule(f, n - 0.5, n + 0.5, samples);
      kernel[halfKernelSize - n] = value;
      kernel[halfKernelSize + n] = value;
    }

    if (quantize) {
      kernel = this.quantize(kernel);
    } else {
      kernel = this.normalizeValues(kernel);
    }

    // Cache the result
    this.kernelCache[kernelName] = kernel;
    return kernel;
  }

  /**
   * Quantizes a kernel so that the values are a multiple of 1/255, suitable for 8-bit canvas operations
   * @param kernel Any kernel
   */
  public static quantize(kernel: number[]): number[] {
    const kernelSize = kernel.length;
    const halfKernelSize = Math.floor(kernelSize / 2);
    let sum = 0;

    for (let n = 0; n < kernelSize; n++) {
      sum += kernel[n];
    }

    // The remaining code renormalizes the kernel to sum to 1. However, a straightforward division doesn't work very
    // well, because we then apply the kernel using 2 passes of an 8-bit canvas, so the cumulative rounding error gets
    // very high. To mitigate this, we not only renormalize but also quantize the values into 8-bit fractions.
    //
    // For the first step, renormalize the kernel so the sum is 255. Round to the nearest integer and measure the
    // error.
    sum /= 255;
    const error: number[] = [];
    let roundedSum = 0;
    for (let n = 0; n < kernelSize; n++) {
      const exactValue = kernel[n] / sum;
      const roundedValue = Math.round(exactValue);
      kernel[n] = roundedValue;
      roundedSum += roundedValue;
      error[n] = roundedValue - exactValue;
    }

    // Add or remove values until the roundedSum is exactly 255

    while (roundedSum < 255) {
      if ((roundedSum - 255) % 2 === 1) {
        // Add 1 to the center element
        kernel[halfKernelSize]++;
        roundedSum++;
      } else {
        // Find maximum error
        let max = 1;
        for (let n = 2; n <= halfKernelSize; n++) {
          if (kernel[halfKernelSize + n] > kernel[halfKernelSize + max]) {
            max = n;
          }
        }

        // Add 2 to the elements with maximum error
        kernel[halfKernelSize + max]++;
        kernel[halfKernelSize - max]++;
        roundedSum += 2;
      }
    }

    while (roundedSum > 255) {
      if ((roundedSum - 255) % 2 === 1) {
        // Subtract 1 from the center element
        kernel[halfKernelSize]--;
        roundedSum--;
      } else {
        // Find minimum error
        let min = 1;
        for (let n = 2; n <= halfKernelSize; n++) {
          if (kernel[halfKernelSize + n] < kernel[halfKernelSize + min]) {
            min = n;
          }
        }

        // Subtract 2 from the elements with minimum error
        kernel[halfKernelSize + min]--;
        kernel[halfKernelSize - min]--;
        roundedSum -= 2;
      }
    }

    // Renormalize the kernel so the sum is 1
    for (let n = 0; n < kernelSize; n++) {
      kernel[n] /= 255;
    }

    return kernel;
  }

  /**
   * Normalizes a kernel so the values sum to 1
   * @param kernel Any kernel
   */
  public static normalizeValues(kernel: number[]): number[] {
    const kernelSize = kernel.length;
    let sum = 0;

    for (let n = 0; n < kernelSize; n++) {
      sum += kernel[n];
    }

    for (let n = 0; n < kernelSize; n++) {
      kernel[n] /= sum;
    }

    return kernel;
  }

  /** Cache of already-calculated Gaussian kernels */
  private static kernelCache: { [name: string]: number[] } = {};
}
