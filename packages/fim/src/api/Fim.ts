// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCapabilities } from './FimCapabilities';
import { FimEngineOptions } from './FimEngineOptions';
import { FimImage } from './FimImage';
import { FimImageOptions } from './FimImageOptions';
import { FimObject } from './FimObject';
import { FimShader } from './FimShader';
import { FimDimensions } from '../primitives/FimDimensions';

/**
 * Parent object when using the FIM library. This object holds images, shaders, and operations used to manipulate 2D
 * images within JavaScript using WebGL.
 */
export interface Fim extends FimBase<FimImage, FimShader> {
}

/** Templated version of the Fim interface which supports specific implementations of image and shader classes */
export interface FimBase<TImage extends FimImage, TShader extends FimShader> extends FimObject {
  /** Maximum dimensions of any image */
  readonly maxImageDimensions: FimDimensions;

  /**
   * Options for the FIM execution engine
   *
   * Note that these properties are read/write, despite the reference to the object being read-only. The application may
   * attempt to change them after creating objects, however changes are not guaranteed to take effect immediately.
   * Generally options take effect on the next method call, however some require calling releaseResources() to recreate
   * the back-end objects altogether.
   */
  readonly engineOptions: FimEngineOptions;

  /**
   * Default image options.
   *
   * Note that these properties are read/write, despite the reference to the object being read-only. Values here are
   * used unless overridden within the image itself.
   */
  readonly defaultImageOptions: FimImageOptions;

  /** Reports the browser and GPU's capabilities */
  readonly capabilities: FimCapabilities;

  /**
   * Creates a new image
   * @param dimensions Image dimensions
   * @param options Optional overrides to the image options from the parent Fim object
   * @param imageName Optional name specified when creating the object to help with debugging
   */
  createImage(dimensions?: FimDimensions, options?: FimImageOptions, imageName?: string): TImage;
}
