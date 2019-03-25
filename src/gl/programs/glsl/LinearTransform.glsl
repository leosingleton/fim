#version 100

precision mediump float;

varying vec2 vCoord;
uniform sampler2D u_input;
uniform float u_m;
uniform float u_b;

void main() {
  vec3 color = texture2D(u_input, vCoord).rgb;
  vec3 newColor = color * u_m + u_b;
  gl_FragColor = vec4(newColor, 1);
}
