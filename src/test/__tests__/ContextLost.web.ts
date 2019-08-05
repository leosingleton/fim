// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ContextLost } from '../ContextLost';
import { FimGLCanvas } from '../../gl';
import { usingAsync } from '@leosingleton/commonlibs';

describe('ContextLost', () => {

  it('Simulates losing context and restoring', async () => {
    usingAsync(new FimGLCanvas(640, 480), async gl => {
      // Register handlers to detect context lost
      let contextLost: boolean;
      let contextRestored: boolean;
      gl.registerObject({
        onContextLost() { contextLost = true; },
        onContextRestored() { contextRestored = true; }
      });

      // Repeat the test 3 times
      for (let n = 0; n < 3; n++) {
        contextLost = contextRestored = false;

        // Simulate a context loss
        await ContextLost.loseContextAsync(gl);
        expect(contextLost).toBeTruthy();
        expect(contextRestored).toBeFalsy();
        expect(gl.isContextLost()).toBeTruthy();

        // Simulate a context restored
        await ContextLost.restoreContextAsync(gl);
        expect(contextLost).toBeTruthy();
        expect(contextRestored).toBeTruthy();
        expect(gl.isContextLost()).toBeFalsy();
      }
    });
  });

});