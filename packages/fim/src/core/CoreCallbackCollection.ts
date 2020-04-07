// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { UnhandledError } from '@leosingleton/commonlibs';

/** Helper class to register and invoke callback functions */
export class CoreCallbackCollection {
  /**
   * Registers a callback to invoke in `invokeCallbacks()`
   * @param callback Callback to invoke
   */
  public registerCallback(callback: () => void): void {
    this.callbacks.push(callback);
  }

  /** Invokes all registered callback functions */
  public invokeCallbacks(): void {
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (err) {
        UnhandledError.reportError(err);
      }
    }
  }

  /** Removes all registered callback functions */
  public removeAllCallbacks(): void {
    this.callbacks = [];
  }

  /** Registered callback functions */
  private callbacks: (() => void)[] = [];
}
