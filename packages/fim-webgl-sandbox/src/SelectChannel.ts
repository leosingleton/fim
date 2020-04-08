// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas, FimGLProgram, FimGLTexture } from '@leosingleton/fim';

/** GL program to create a greyscale image from one color channel */
export class SelectChannelProgram extends FimGLProgram {
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/SelectChannel.glsl');
    super(canvas, fragmentShader);
    this.compileProgram();
  }

  public setInputs(inputTexture: FimGLTexture, channel: 'R' | 'G' | 'B' | 'A'): void {
    this.fragmentShader.uniforms.u_input.variableValue = inputTexture;

    let channelVector: number[];
    switch (channel) {
      case 'R': channelVector = [1, 0, 0, 0]; break;
      case 'G': channelVector = [0, 1, 0, 0]; break;
      case 'B': channelVector = [0, 0, 1, 0]; break;
      case 'A': channelVector = [0, 0, 0, 1]; break;
    }
    this.fragmentShader.uniforms.u_channel.variableValue = channelVector;
  }
}
