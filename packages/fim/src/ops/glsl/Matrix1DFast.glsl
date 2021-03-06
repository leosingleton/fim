// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

@const int KERNEL_SIZE

precision mediump float;

varying vec2 vCoord;
uniform sampler2D uInput;
uniform vec2 uInputSize;
uniform float uKernel[KERNEL_SIZE];
uniform float uIsX;
uniform float uIsY;

// Use the midpoint of every other pixel. Let the GPU's sampler average consecutive
// pixels to closely approximate the same blur with half the number of operations.
void main()
{
  vec2 onePixel = vec2(1.0, 1.0) / uInputSize;
  const int halfKernelSize = KERNEL_SIZE / 2;

  vec4 colorSum = texture2D(uInput, vCoord) * uKernel[halfKernelSize];
  for (int n = 0; n < halfKernelSize; n++)
  {
    float n2 = float(n * 2) + 0.5;
    colorSum += texture2D(uInput, vCoord + onePixel * vec2(n2 * uIsX, n2 * uIsY)) *
      uKernel[halfKernelSize + n + 1];
    colorSum += texture2D(uInput, vCoord + onePixel * vec2(-n2 * uIsX, -n2 * uIsY)) *
      uKernel[halfKernelSize - n - 1];
  }

  gl_FragColor = vec4(colorSum.rgb, 1.0);
}
