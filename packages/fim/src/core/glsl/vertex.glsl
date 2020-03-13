// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

#version 100

attribute vec4 aPos;
attribute vec2 aTex;
varying vec2 vCoord;

// Simple vertex shader which accepts vertices and texture coordinates as attributes for doing 2D rendering
void main()
{
  gl_Position = aPos;
  vCoord = aTex;
}
