#version 100

precision mediump float;

varying vec2 vCoord;
uniform sampler2D u_input;

void main() {
  gl_FragColor = texture2D(u_input, vCoord);
}
