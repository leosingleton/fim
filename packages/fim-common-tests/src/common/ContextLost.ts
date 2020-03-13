// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { AsyncManualResetEvent } from '@leosingleton/commonlibs';
import { CoreCanvasWebGL } from '@leosingleton/fim/internals';

/** Forces a WebGL context loss for test purposes */
export function loseContextAsync(canvas: CoreCanvasWebGL): Promise<void> {
  // The WebGL extension to simulate context loss doesn't execute the handlers before resuming JavaScript execution.
  // Work around this by registering a handler and waiting on it.
  const contextLostEvent = new AsyncManualResetEvent();
  canvas.registerContextLostHandler(() => contextLostEvent.setEvent());

  // Get the extension. We save it, as once the context is lost, gl.getExtension() seems to be unreliable.
  const gl = canvas.getContext();
  const extension = gl.getExtension('WEBGL_lose_context');
  if (extension) {
    canvas.throwWebGLErrors();
    loseContextExtensions[canvas.imageHandle] = extension;

    // Simulate a context loss
    extension.loseContext();
  } else {
    // Some implementations like headless-gl do not support the WEBGL_lose_context extension. The second-best way is
    // to fake it by calling the events ourselves. The typecast to any allows us to call a private function.
    (canvas as any).onContextLost();
  }

  // Wait for the handler to execute
  return contextLostEvent.waitAsync();
}

/** Forces the WebGL context to be restored for test purposes */
export function restoreContextAsync(canvas: CoreCanvasWebGL): Promise<void> {
  // restoreContext() doesn't seem to have the same problem as loseContext(), but we also wait on the handler for
  // consistency.
  const contextRestoredEvent = new AsyncManualResetEvent();
  canvas.registerContextRestoredHandler(() => contextRestoredEvent.setEvent());

  // Simulate the context being restored
  const extension = loseContextExtensions[canvas.imageHandle];
  if (extension) {
    extension.restoreContext();
  } else {
    // Some implementations like headless-gl do not support the WEBGL_lose_context extension. The second-best way is
    // to fake it by calling the events ourselves. The typecast to any allows us to call a private function.
    (canvas as any).onContextRestored();
  }

  // Wait for the handler to execute
  return contextRestoredEvent.waitAsync();
}

/**
 * Cache of the `WEBGL_lose_context` extensions. It seems you must save it between the call to `loseContext()` and
 * `restoreContext()` as opposed to calling `getExtension()` again.
 */
const loseContextExtensions: { [handle: string]: WEBGL_lose_context } = {};
