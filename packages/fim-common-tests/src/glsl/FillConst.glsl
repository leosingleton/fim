// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

precision mediump float;

varying vec2 vCoord;
@const float cColor

void main() {
  gl_FragColor = vec4(cColor, cColor, cColor, 1.0);
}
