// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

precision mediump float;

varying vec2 vCoord;
uniform sampler2D u_input1;
uniform sampler2D u_input2;
uniform float u_input1Alpha;

void main() {
  vec3 input1 = texture2D(u_input1, vCoord).rgb;
  vec3 input2 = texture2D(u_input2, vCoord).rgb;
  vec3 outColor = min(input1, input2);
  gl_FragColor = vec4(outColor, 1);
}
