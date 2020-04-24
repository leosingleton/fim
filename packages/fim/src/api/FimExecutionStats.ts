// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Object to return the current execution stats of an instance of the FIM library */
export interface FimExecutionStats {
  /** Images, indexed by handle */
  readonly imageHandles: { [handle: string]: FimImageStats };

  /** WebGL shaders, indexed by handle */
  readonly shaderHandles: { [handle: string]: FimShaderStats };
}

/** Execution stats for an image */
export interface FimImageStats {
  /** 2D canvas resources, including `OffscreenCanvas` objects */
  readonly canvas2D: FimImageStatsByResource;

  /** WebGL texture resources */
  readonly glTexture: FimImageStatsByResource;
}

/** Execution stats for one resource type of an image */
export interface FimImageStatsByResource {
  /** The operation was performed as an explicit operation invoked by the FIM library's client */
  readonly explicit: FimImageStatsByResourceAndOperation;

  /** The operation was performed as part of importing/exporting the image contents to/from a non-FIM format */
  readonly importExport: FimImageStatsByResourceAndOperation;

  /**
   * The operation was performed transparently as part of converting the image contents between two different internal
   * formats
   */
  readonly internalConversion: FimImageStatsByResourceAndOperation;
}

/** Execution stats for one resource type and operation type of an image */
export interface FimImageStatsByResourceAndOperation {
  /** Number of times the resource has been read */
  readonly readCount: number;

  /** Number of times the resource has been written to */
  readonly writeCount: number;
}

/** Execution stats for a WebGL shader */
export interface FimShaderStats {
  /** Number of times the shader has been executed */
  readonly executionCount: number;

  /** Average execution time of the shader, in milliseconds */
  readonly avgExecutionTime: number;

  /** Average execution time of the shader per million pixels, in milliseconds */
  readonly avgExecutionTimePMP: number;
}
