// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Shader } from './Shader';

export async function createSampleShaders(): Promise<Shader[]> {
  const sample1 = new Shader('Sample 1: RGB Gradient',
`#version 100
precision mediump float;

// WebGL Sandbox passes the input coordinates here.
// Values range from 0.0 to 1.0 where (0,0) is lower-left.
varying vec2 vCoord;

void main()
{
  // The output color of the fragment shader is returned in gl_FragColor
  gl_FragColor = vec4(
    vCoord.x * vCoord.y,         // Red
    (1.0 - vCoord.x) * vCoord.y, // Green
    vCoord.x * (1.0 - vCoord.y), // Blue
    1.0);                        // Alpha
}`);
  await sample1.compile();

  const sample2 = new Shader('Sample 2: Invert',
`#version 100
precision mediump float;

// WebGL Sandbox passes the input coordinates here.
// Values range from 0.0 to 1.0 where (0,0) is lower-left.
varying vec2 vCoord;

// This shader takes a texture as input
uniform sampler2D uInputTexture;

void main()
{
  // Read the color of the pixel in the input image
  vec3 inputPixel = texture2D(uInputTexture, vCoord).rgb;

  // The output color of the fragment shader is returned in gl_FragColor
  gl_FragColor = vec4(vec3(1.0) - inputPixel, 1.0);
}`);
  await sample2.compile();

  const sample3 = new Shader('Sample 3: Gaussian Blur',
`#version 100
precision mediump float;

// WebGL Sandbox passes the input coordinates here.
// Values range from 0.0 to 1.0 where (0,0) is lower-left.
varying vec2 vCoord;

// The input image
uniform sampler2D uInputTexture;

// This parameter takes the input dimensions, in pixels
uniform vec2 uInputDimensions;

// This parameter specifies the number of elements in the uGaussianKernel array
@const int KERNEL_SIZE

// This parameter requires a Gaussian kernel, such as the following (sigma=2):
// [0.0705, 0.1333, 0.1882, 0.2156, 0.1882, 0.1333, 0.0705]
uniform float uGaussianKernel[KERNEL_SIZE];

void main()
{
  vec2 onePixel = vec2(1.0) / uInputDimensions;
  vec2 startOffset = vec2(-float(KERNEL_SIZE / 2));

  vec4 colorSum = vec4(0.0);
  for (int x = 0; x < KERNEL_SIZE; x++)
  {
    for (int y = 0; y < KERNEL_SIZE; y++)
    {
      vec2 coord = vCoord + onePixel * (startOffset + vec2(x, y));
      colorSum += texture2D(uInputTexture, coord) * uGaussianKernel[x] * uGaussianKernel[y];
    }
  }

  gl_FragColor = vec4(colorSum.rgb, 1.0);
}`);
  await sample3.compile();
  sample3.values['const-KERNEL_SIZE'] = '7';
  sample3.values['uniform-uInputDimensions'] = '[512, 512]';
  sample3.values['uniform-uGaussianKernel'] = '[0.0705, 0.1333, 0.1882, 0.2156, 0.1882, 0.1333, 0.0705]';

  return [sample1, sample2, sample3];
}
