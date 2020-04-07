// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Enum for `OptimizerBase.recordImageRead()` and `OptimizerBase.recordImageWrite()` */
export const enum OperationType {
  /** The operation was performed as an explicit operation invoked by the FIM library's client */
  Explicit,

  /** The operation was performed as part of importing/exporting the image contents to/from a non-FIM format */
  ImportExport,

  /**
   * The operation was performed transparently as part of converting the image contents between two different internal
   * formats
   */
  InternalConversion
}
