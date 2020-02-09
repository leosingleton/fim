// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimExecutionOptions } from './FimExecutionOptions';
import { FimImage } from './FimImage';
import { FimImageOptions } from './FimImageOptions';
import { FimObject } from './FimObject';
import { FimDimensions } from '../primitives/FimDimensions';

/**
 * Parent object when using the FIM library. This object holds images, shaders, and operations used to manipulate 2D
 * images within JavaScript using WebGL.
 */
export interface Fim<TImage extends FimImage> extends FimObject {
  /** Maximum dimensions of any image */
  readonly maxImageDimensions: FimDimensions;

  /**
   * Options for the FIM execution engine
   *
   * Note that these properties are read/write. The application may attempt to change them after creating objects,
   * however changes are not guaranteed to take effect immediately. Generally options take effect on the next method
   * call, however some require calling releaseResources() to recreate the back-end objects altogether.
   */
  executionOptions: FimExecutionOptions;

  /** Default image options. Values here are used unless overridden within the image itself.  */
  defaultImageOptions: FimImageOptions;

  /**
   * Creates a new image
   * @param dimensions Image dimensions
   * @param options Optional overrides to the image options from the parent Fim object
   * @param imageName Optional name specified when creating the object to help with debugging
   */
  createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string): TImage;

  /**
   * Hint to dispatch all pending commands to execution pipeline
   *
   * By default, FIM queues commands until it encounters a FimImage.exportToXYZ() call, then automatically executes
   * all commands in the queue. Doing so allows FIM to look ahead to optimize execution. However, in some cases, we may
   * want to begin execution even though we're not ready to output the result. In which case, beginExecution() must be
   * called explicitly.
   */
  beginExecution(): void;
}
