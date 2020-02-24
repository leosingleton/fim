// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ResourcePool, RetentionStrategy, IDisposable, makeDisposable } from '@leosingleton/commonlibs';

export type DisposableCanvas = HTMLCanvasElement & IDisposable;

/**
 * Safari has a hard limit of 15 WebGL contexts, at which point it logs an error to the JavaScript console and drops
 * the least recently used. The Khronos specs say the lose_context extention is supposed to allow you to force dispose
 * (https://www.khronos.org/registry/webgl/extensions/WEBGL_lose_context/) however it doesn't seem to work. Instead, we
 * use a resource pool to reuse canvases rather than waiting for the garbage collector to dispose them.
 */
export class DomCanvasPool extends ResourcePool<DisposableCanvas> {
  public constructor() {
    super(RetentionStrategy.KeepMaximum);
  }

  public getCanvas(): DisposableCanvas {
    return this.getOrCreateObject('canvas', () => {
      const canvas = document.createElement('canvas') as DisposableCanvas;

      return makeDisposable(canvas, canvas => {
        // Resizing the canvas to zero seems to help Safari release memory without having to wait for the garbage
        // collector. This helps prevent crashes, particularly on mobile devices.
        canvas.width = 0;
        canvas.height = 0;

        document.body.removeChild(canvas);
      });
    });
  }

  protected freeze(canvas: DisposableCanvas): boolean {
    // Resizing the canvas to zero seems to help Safari release memory without having to wait for the garbage
    // collector. This helps prevent crashes, particularly on mobile devices.
    canvas.width = 0;
    canvas.height = 0;

    return true;
  }
}

/** Implementation of DomCanvasPool for WebGL canvases */
export class DomCanvasPoolWebGL extends DomCanvasPool {
  protected defrost(canvas: DisposableCanvas): boolean {
    // Ensure that WebGL canvases still have a valid context. Browsers may choose to lose it while it was in the pool
    // if running low on resources.
    const context = canvas.getContext('webgl');
    if (context.isContextLost()) {
      return false;
    }

    return true;
  }
}
