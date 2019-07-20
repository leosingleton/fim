// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from '../FimCanvas';

describe('FimCanvas', () => {

  it('NodeJS does not support OffscreenCanvas', () => {
    let oc = FimCanvas.supportsOffscreenCanvas;
    expect(oc).toBeFalsy();
  });

});
