// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../gl/FimGLCanvas';
import { FimGLError } from '../gl/FimGLError';
import { AsyncManualResetEvent } from '@leosingleton/commonlibs';

export namespace ContextLost {
  /** Forces a WebGL context loss for test purposes */
  export function loseContextAsync(glCanvas: FimGLCanvas): Promise<void> {
    // The WebGL extension to simulate context loss doesn't exectute the handlers before resuming JavaScript execution.
    // Work around this by registering a handler and waiting on it.
    const contextLostEvent = new AsyncManualResetEvent();
    glCanvas.registerForContextLost(() => contextLostEvent.setEvent());

    // Get the extension. We save it, as once the context is lost, gl.getExtension() seems to be unreliable.
    const gl = glCanvas.gl;
    const extension = gl.getExtension('WEBGL_lose_context');
    FimGLError.throwOnError(gl);
    loseContextExtensions[glCanvas.imageId] = extension;

    // Simulate a context loss
    extension.loseContext();

    // Wait for the handler to execute
    return contextLostEvent.waitAsync();
  }

  /** Forces the WebGL context to be restored for test purposes */
  export function restoreContextAsync(glCanvas: FimGLCanvas): Promise<void> {
    // restoreContext() doesn't seem to have the same problem as loseContext(), but we also wait on the handler for
    // consistency.
    const contextRestoredEvent = new AsyncManualResetEvent();
    glCanvas.registerForContextRestored(() => contextRestoredEvent.setEvent());

    // Simulate the context being restored
    const extension = loseContextExtensions[glCanvas.imageId];
    extension.restoreContext();

    // Wait for the handler to execute
    return contextRestoredEvent.waitAsync();
  }

  /**
   * Creates a background task to simulate the loss of the WebGL context and test the application's exception handling
   * and recovery
   * @param gl WebGL canvas to simulate context loss
   * @param interval Interval of WebGL context loss, in seconds. The context is automatically restored one second
   *    later, then the interval repeats.
   */
  export function simulateContextLoss(gl: FimGLCanvas, interval: number): void {
    async function loseContext(): Promise<void> {
      await ContextLost.loseContextAsync(gl);
      setTimeout(restoreContext, 1000);
    }

    async function restoreContext(): Promise<void> {
      await ContextLost.restoreContextAsync(gl);
      setTimeout(loseContext, interval * 1000);
    }

    console.log('Context loss simulation enabled');
    setTimeout(loseContext, interval * 1000);
  }
}

const loseContextExtensions: { [id: number]: WEBGL_lose_context } = {};
