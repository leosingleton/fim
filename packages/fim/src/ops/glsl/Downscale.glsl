// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100
precision mediump float;
varying vec2 vCoord;

/** Input image */
uniform sampler2D uInput;

/** Number of pixels to sample */
@const int PIXELS

/** Pixels to sample. The X and Y in the vector are the offset. The Z is the weight. */
uniform vec3 uPixels[PIXELS];

void main()
{
  vec4 sum = vec4(0.0);
  for (int n = 0; n < PIXELS; n++) {
    vec3 pixel = uPixels[n];
    sum += texture2D(uInput, vCoord + pixel.xy) * pixel.z;
  }

  gl_FragColor = sum;
}
