// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Options for FIM factory methods */
export interface FimFactoryOptions {
}

/** Default values if no FimFactoryOptions is provided */
export const defaultFactoryOptions: FimFactoryOptions = {
};

/**
 * Merges two sets of FimFactoryOptions
 * @param parent Parent object. Has lower precidence.
 * @param child Child object. Has higher precidence. May be undefined.
 */
export function mergeFactoryOptions(parent: FimFactoryOptions, child: FimFactoryOptions): FimFactoryOptions {
  if (!child) {
    return parent;
  }

  return {
  };
}
