// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Optimization hints for the FIM engine and command dispatchers */
export interface DispatcherOptimizationHints {
  /** If true, this command can be queued indefinitely. If false, it must be executed as soon as possible. */
  canQueue: boolean;

  /** Collection of object handles that this command will read from. Used for lookahead optimizations. */
  readHandles?: string[];

  /** Collection of object handles that this command will write to. Used for lookahead optimizations. */
  writeHandles?: string[];
}
