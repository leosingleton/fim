// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';

/** Exposes the browser and GPU's capabilties */
export interface FimCapabilities extends FimBrowserCapabilities, FimWebGLCapabilities {
}

/** Exposes the browser's capabilties */
export interface FimBrowserCapabilities {
  /** Whether the current browser supports offscreen canvases */
  readonly supportsOffscreenCanvas: boolean;

  /** Whether the current browser supports ImageBitmap */
  readonly supportsImageBitmap: boolean;
}

/** Exposes the GPU's capabilties */
export interface FimWebGLCapabilities {
  readonly glVersion: string;
  readonly glShadingLanguageVersion: string;
  readonly glVendor: string;
  readonly glRenderer: string;
  readonly glUnmaskedVendor: string;
  readonly glUnmaskedRenderer: string;
  readonly glMaxRenderBufferSize: number;
  readonly glMaxTextureImageUnits: number;
  readonly glMaxTextureSize: number;
  readonly glExtensions: string[];

  /** Maximum texture depth when using linear sampling */
  readonly glMaxTextureDepthLinear: FimBitsPerPixel;

  /** Maximum texture depth when using nearest pixel sampling */
  readonly glMaxTextureDepthNearest: FimBitsPerPixel;
}
