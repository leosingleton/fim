// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Execution strategy (space vs. time) */
export const enum FimExecutionStrategy {
  /** Maximize speed (e.g. minimize execution time) */
  MaximizeSpeed,

  /** Minimize GPU memory consumption */
  MinimizeMemory
}
