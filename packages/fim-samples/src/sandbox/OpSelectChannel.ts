// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimImage, FimObject, FimOperationShader } from '@leosingleton/fim';

/** GL program to create a greyscale image from one color channel */
export class OpSelectChannel extends FimOperationShader {
  /**
   * Constructor
   * @param parent Parent object
   */
  public constructor(parent: FimObject) {
    const fragmentShader = require('./glsl/SelectChannel.glsl');
    super(parent, fragmentShader, undefined, 'SelectChannel');
  }

  /**
   * Sets the inputs of the SelectChannel shader. Returns `this` so the operation may be run in a one-line call to
   * `FimImage.executeAsync()`.
   * @param input Input image
   * @param channel Which channel to select
   * @returns `this`
   */
  public $(input: FimImage, channel: 'R' | 'G' | 'B' | 'A'): this {
    let channelVector: number[];
    switch (channel) {
      case 'R': channelVector = [1, 0, 0, 0]; break;
      case 'G': channelVector = [0, 1, 0, 0]; break;
      case 'B': channelVector = [0, 0, 1, 0]; break;
      case 'A': channelVector = [0, 0, 0, 1]; break;
    }

    this.shader.setUniforms({
      uInput: input,
      uChannel: channelVector
    });

    return this;
  }
}
