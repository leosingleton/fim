// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeImageClient } from './FimNodeImageClient';
import { FimNode } from '../../api/FimNode';
import { CommandNodeCreateImage } from '../commands/CommandNodeCreateImage';
import { NodeDispatcherOpcodes } from '../commands/NodeDispatcherOpcodes';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { FimClient } from '@leosingleton/fim/internals';

/** Client implementation of the Fim interface for running in Node.js */
export class FimNodeClient extends FimClient implements FimNode {
  public createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string): FimNodeImageClient {
    // Default values
    dimensions = dimensions ?? this.maxImageDimensions;
    options = options ?? {};

    // Dispatch the create command to the back-end
    const image = new FimNodeImageClient(this, this.dispatcher, dimensions, options, imageName);
    const command: CommandNodeCreateImage = {
      opcode: NodeDispatcherOpcodes.CreateImage,
      imageDimensions: dimensions,
      imageHandle: image.handle,
      optimizationHints: {
        canQueue: true
      }
    };
    this.dispatchCommand(command);

    return image;
  }
}
