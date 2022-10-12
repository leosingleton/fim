// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';

/** Exposes the browser and GPU's capabilties */
export interface FimCapabilities extends FimBrowserCapabilities, FimWebGLCapabilities {
}

/** Exposes the browser's capabilties */
export interface FimBrowserCapabilities {
  /** User Agent string or equivalent for Node.js */
  readonly userAgentString: string;

  /** Number of logical CPU cores for concurrent execution. May report zero if unknown. */
  readonly logicalCpuCount: number;

  /** Estimated memory of the device, in bytes. May report zero if unknown. */
  readonly estimatedMemory: number;

  /** Whether the current browser supports offscreen canvases */
  readonly supportsOffscreenCanvas: boolean;

  /** Whether the current browser supports ImageBitmap */
  readonly supportsImageBitmap: boolean;

  /** Maximum single dimension of a canvas (width or height) */
  readonly maxCanvasSize: number;
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
  readonly glMaxFragmentUniformVectors: number;
  readonly glMaxVertexUniformVectors: number;
  readonly glExtensions: string[];

  /** Texture depths supported when using linear sampling */
  readonly glTextureDepthsLinear: FimBitsPerPixel[];

  /** Texture depths supported when using nearest pixel sampling */
  readonly glTextureDepthsNearest: FimBitsPerPixel[];
}
