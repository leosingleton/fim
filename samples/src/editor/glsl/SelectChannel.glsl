// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

precision mediump float;

varying vec2 vCoord;
uniform sampler2D u_input;
uniform vec4 u_channel;

/** GL program to create a greyscale image from one color channel */
void main()
{
  vec4 raw = texture2D(u_input, vCoord);
  float val = dot(raw, u_channel);
  gl_FragColor = vec4(vec3(val), 1.0);
}
