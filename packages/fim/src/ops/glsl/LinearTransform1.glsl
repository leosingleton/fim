// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

precision mediump float;

varying vec2 vCoord;
uniform sampler2D uInput;
uniform float uM;
uniform vec3 uB;

// Performs a linear transformation with 1 input
void main()
{
  vec3 color = texture2D(uInput, vCoord).rgb;
  vec3 newColor = color * uM + uB;
  gl_FragColor = vec4(newColor, 1);
}
