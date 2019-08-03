// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../gl';
import { AsyncManualResetEvent } from '@leosingleton/commonlibs';

export namespace ContextLost {
  /** Forces a WebGL context loss for test purposes */
  export function loseContextAsync(glCanvas: FimGLCanvas): Promise<void> {
    // The WebGL extension to simulate context loss doesn't exectute the handlers before resuming JavaScript execution.
    // Work around this by registering a handler and waiting on it.
    let contextLostEvent = new AsyncManualResetEvent();
    glCanvas.registerObject({
      onContextLost() { contextLostEvent.set(); },
      onContextRestored() {}
    });

    // Simulate a context loss
    let loseContext = glCanvas.gl.getExtension('WEBGL_lose_context');
    loseContext.loseContext();

    // Wait for the handler to execute
    return contextLostEvent.waitAsync();
  }

  /** Forces the WebGL context to be restored for test purposes */
  export function restoreContextAsync(glCanvas: FimGLCanvas): Promise<void> {
    // restoreContext() doesn't seem to have the same problem as loseContext(), but we also wait on the handler for
    // consistency.
    let contextRestoredEvent = new AsyncManualResetEvent();
    glCanvas.registerObject({
      onContextLost() {},
      onContextRestored() { contextRestoredEvent.set(); }
    });

    // Simulate the context being restored
    let loseContext = glCanvas.gl.getExtension('WEBGL_lose_context');
    loseContext.restoreContext();

    // Wait for the handler to execute
    return contextRestoredEvent.waitAsync();
  }
}
