// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

precision mediump float;

varying vec2 vCoord;
uniform sampler2D uInput1;
uniform sampler2D uInput2;
uniform float uInput1Alpha;

void main()
{
  vec3 input1 = texture2D(uInput1, vCoord).rgb;
  vec3 input2 = texture2D(uInput2, vCoord).rgb;
  vec3 outColor = input1 * uInput1Alpha + input2 * (1.0 - uInput1Alpha);
  gl_FragColor = vec4(outColor, 1);
}
