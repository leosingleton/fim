#version 100

@const int KERNEL_SIZE

precision mediump float;

varying vec2 vCoord;
uniform sampler2D u_input;
uniform vec2 u_inputSize;
uniform float u_kernel[KERNEL_SIZE];
uniform int u_isX;
uniform int u_isY;

void main() {
  vec2 onePixel = vec2(1.0, 1.0) / u_inputSize;
  const int halfKernelSize = KERNEL_SIZE / 2;

  vec4 colorSum = vec4(0.0);
  for (int n = 0; n < KERNEL_SIZE; n++) {
    int pos = n - halfKernelSize;
    colorSum += texture2D(u_input, vCoord + onePixel * vec2(pos * u_isX, pos * u_isY)) * u_kernel[n];
  }

  gl_FragColor = vec4(colorSum.rgb, 1.0);
}
