// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

// We're doing 2D graphics on full-frame canvases, so all programs use the same vertex shader. Nothing special,
// just maps coordinates from (0, 0) to (1, 1).
attribute vec2 aPos;
uniform float uFlip;
varying vec2 vCoord;

// Workaround for a bug in the GLSL compiler. We normally mangle uniform names, but uniforms in the vertex shader can
// clash with those in the fragment shader. Workaround for now by disabling name mangling on uniforms in the vertex
// shader until I figure out a better way to fix the bug...
@nomangle uFlip

void main() {
  // Convert from 0->1 to 0->2
  vec2 zeroToTwo = aPos * 2.0;

  // Convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  // gl_Position is a special variable a vertex shader is responsible for setting
  gl_Position = vec4(clipSpace * vec2(1, uFlip), 0, 1);

  // Pass the texCoord to the fragment shader. The GPU will interpolate this value between points.
  vCoord = aPos;
}
