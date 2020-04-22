// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimColor } from '../primitives/FimColor';
import { FimTextureSampling } from '../primitives/FimTextureSampling';

/**
 * Options during FimImage creation. All values are optional. If undefined, the value is inherited from the FIM-level
 * default, or from built-in defaults.
 *
 * Note that as of FIM v2, the color channel options have been removed. All images are RGBA format. Greyscale and RGB
 * have limited support as rendering targets in WebGL, and it's not worth the effort to support, as the client would
 * always have to implement a fallback to an RGBA implementation anyway. Plus, some implementations use RGBA
 * internally anyway, negating the memory savings of the other format.
 */
export interface FimImageOptions {
  /** Bits per pixel */
  bpp?: FimBitsPerPixel;

  /** Texture sampling options for WebGL minification and magnification */
  sampling?: FimTextureSampling;

  /**
   * Automatically backs up WebGL textures to a non-WebGL canvas. Adds extra performance and memory overheads, but can
   * be used to ensure the image contents are not lost due to loss of the WebGL context. In particular, this frequently
   * happens when a page loses focus.
   */
  autoBackup?: boolean;

  /**
   * Automatically populates the image with the specified fill color whenever there are no image contents. This can
   * occur on first use, or also when the WebGL context is lost and there is no backup to a non-WebGL image storage.
   */
  defaultFillColor?: FimColor | string;

  /**
   * Many GPUs suppor larger texture sizes than renderbuffer sizes, meaning they can read larger images than they are
   * capable of writing. By default (`false`), images are automatically downscaled to fit the GPU's renderbuffer.
   * However, if this value is set to `true`, then the image is downscaled to the GPU's maximum texture size instead.
   * Setting this value to `true` does make the image read-only for any WebGL shaders--attempting to use it as a
   * destination image in a shader exectution will throw a `FimErrorCode.ImageReadonly` exception.
   */
  oversizedReadOnly?: boolean;

  /**
   * This optimization is enabled by default and reduces both WebGL and canvas memory consumption at minimal degredation
   * in image quality. When a smaller image is copied to a large one, rather than upscaling the source image contents,
   * the destination image is instead transparently downscaled to match the source's dimensions. Setting this value on
   * the destination `FimImage` disables this optimization.
   */
  preserveDownscaledDimensions?: boolean;

  /**
   * A scaling value ranging from [1.0, 0.0) which causes the underlying canvas and WebGL textures to be smaller than
   * the reported image size. A value of 1.0 indicates no downscaling. Downscaling can improve performance and reduce
   * memory consumption.
   *
   * Note that downscaling may occur automatically even without this setting if the requested image is larger than the
   * parent FIM object or GPU hardware limits.
   */
  downscale?: number;

  /**
   * A scaling value ranging from [1.0, 0.0) which causes the underlying WebGL textures to be smaller than the reported
   * image size. A value of 1.0 indicates no downscaling. Downscaling can improve performance and reduce memory
   * consumption.
   *
   * Note that downscaling may occur automatically even without this setting if the requested image is larger than the
   * parent FIM object or GPU hardware limits.
   *
   * Also, note that WebGL texture downscaling is controlled by two values. The actual downscaling value is:
   *   min(downscale, glDownscale).
   */
  glDownscale?: number;
}

/** Default values if no FimImageOptions is configured */
export const defaultImageOptions: FimImageOptions = {
  bpp: FimBitsPerPixel.BPP16,
  sampling: FimTextureSampling.Linear,
  autoBackup: false,
  defaultFillColor: undefined,
  oversizedReadOnly: false,
  preserveDownscaledDimensions: true,
  downscale: 1,
  glDownscale: 1,
};

/**
 * Merges two sets of FimImageOptions
 * @param parent Parent object. Has lower precidence.
 * @param child Child object. Has higher precidence. May be undefined.
 */
export function mergeImageOptions(parent: FimImageOptions, child?: FimImageOptions): FimImageOptions {
  if (!child) {
    return parent;
  }

  return {
    bpp: child.bpp ?? parent.bpp,
    sampling: child.sampling ?? parent.sampling,
    autoBackup: child.autoBackup ?? parent.autoBackup,
    defaultFillColor: child.defaultFillColor ?? parent.defaultFillColor,
    oversizedReadOnly: child.oversizedReadOnly ?? parent.oversizedReadOnly,
    preserveDownscaledDimensions: child.preserveDownscaledDimensions ?? parent.preserveDownscaledDimensions,
    downscale: child.downscale ?? parent.downscale,
    glDownscale: child.glDownscale ?? parent.glDownscale
  };
}
