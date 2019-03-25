// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

precision mediump float;

varying vec2 vCoord;
uniform sampler2D u_old;
uniform sampler2D u_input;
uniform float u_newAlpha;

void main() {
  vec4 old = texture2D(u_old, vCoord);
  vec4 new = texture2D(u_input, vCoord);

  gl_FragColor = old * (1.0 - u_newAlpha) + new * u_newAlpha;
}
