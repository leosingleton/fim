// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

precision mediump float;

varying vec2 vCoord;
uniform sampler2D uInput;
uniform vec4 uChannel;

/** GL program to create a greyscale image from one color channel */
void main()
{
  vec4 raw = texture2D(uInput, vCoord);
  float val = dot(raw, uChannel);
  gl_FragColor = vec4(vec3(val), 1.0);
}
