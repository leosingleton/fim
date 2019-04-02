// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';

describe('FimGLCanvas', () => {

  it('Creates and disposes', () => {
    let b = new FimGLCanvas(640, 480);
    expect(b.getCanvas()).toBeDefined();

    b.dispose();
    expect(b.getCanvas()).toBeUndefined();

    // Double-dispose
    b.dispose();
    expect(b.getCanvas()).toBeUndefined();
  });

});
