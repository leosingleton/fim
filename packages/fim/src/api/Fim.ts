// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCapabilities } from './FimCapabilities';
import { FimEngineOptions } from './FimEngineOptions';
import { FimImage } from './FimImage';
import { FimImageOptions } from './FimImageOptions';
import { FimObject } from './FimObject';
import { FimResourceMetrics, FimResourceUsage } from './FimResourceUsage';
import { FimShader } from './FimShader';
import { FimDimensions } from '../primitives/FimDimensions';
import { GlslShader } from 'webpack-glsl-minify';

/**
 * Parent object when using the FIM library. This object holds images, shaders, and operations used to manipulate 2D
 * images within JavaScript using WebGL.
 */
export type Fim = FimBase<FimImage, FimShader>;

/** Templated version of the `Fim` interface which supports specific implementations of image and shader classes */
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
   * Returns whether the WebGL context is lost. Attempting to perform any WebGL operations while the context is lost
   * will throw an exception.
   */
  isContextLost(): boolean;

  /**
   * Registers a callback to invoke when a WebGL context lost event occurs
   * @param handler Handler to invoke
   */
  registerContextLostHandler(handler: () => void): void;

  /**
   * Registers a callback to invoke when a WebGL context restored event occurs
   * @param handler Handler to invoke
   */
  registerContextRestoredHandler(handler: () => void): void;

  /** Returns metrics on the current resource usage of this FIM instance */
  getResourceMetrics(): FimResourceMetrics;

  /** Returns metrics on the current resource usage of this FIM instance, broken down by resource type */
  getResourceMetricsDetailed(): FimResourceUsage;

  /**
   * Creates a new image
   * @param options Optional overrides to the image options from the parent Fim object
   * @param dimensions Optional image dimensions. If unspecified, defaults to the dimensions of the FIM instance.
   * @param name Optional name specified when creating the object to help with debugging
   */
  createImage(options?: FimImageOptions, dimensions?: FimDimensions, name?: string): TImage;

  /**
   * Creates a new image from a PNG file
   * @param pngFile PNG file, as a Uint8Array
   * @param options Optional overrides to the image options from the parent Fim object
   * @param name Optional name specified when creating the object to help with debugging
   */
  createImageFromPngAsync(pngFile: Uint8Array, options?: FimImageOptions, name?: string): Promise<TImage>;

  /**
   * Creates a new image from a JPEG file
   * @param jpegFile JPEG file, as a Uint8Array
   * @param options Optional overrides to the image options from the parent Fim object
   * @param name Optional name specified when creating the object to help with debugging
   */
  createImageFromJpegAsync(jpegFile: Uint8Array, options?: FimImageOptions, name?: string): Promise<TImage>;

  /**
   * Creates a WebGL fragment shader for performing processing on an image
   * @param fragmentShader Fragment shader, created using webpack-glsl-minify
   * @param vertexShader Optional vertex shader, created using webpack-glsl-minify
   * @param name Optional shader name, for debugging
   */
  createGLShader(fragmentShader: GlslShader, vertexShader?: GlslShader, name?: string): TShader;
}
