// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeImage } from './FimNodeImage';
import { Fim, FimDimensions, FimImageOptions } from '@leosingleton/fim';

/**
 * Implementation of the FIM library for running in Node.js. This object holds images, shaders, and operations used
 * to manipulate 2D images within JavaScript using WebGL.
 */
export interface FimNode extends Fim {
  // Add Node-specific return types to Fim methods
  createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string): FimNodeImage;
}
