// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImage } from './FimBrowserImage';
import { Fim, FimDimensions, FimImageOptions } from '@leosingleton/fim';

/**
 * Implementation of the FIM library for running in web browsers. This object holds images, shaders, and operations used
 * to manipulate 2D images within JavaScript using WebGL.
 */
export interface FimBrowser extends Fim {
  // Add browser-specific return types to Fim methods
  createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string): FimBrowserImage;
}