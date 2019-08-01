// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCapabilities } from '../FimGLCapabilities';

describe('FimGLCapabilities', () => {
  it('Reads WebGL capabilities', () => {
    let caps = FimGLCapabilities.getCapabilities();
    expect(caps.renderer.length).toBeGreaterThan(0);
    expect(caps.vendor.length).toBeGreaterThan(0);
    expect(caps.unmaskedRenderer.length).toBeGreaterThan(0);
    expect(caps.unmaskedVendor.length).toBeGreaterThan(0);
    expect(caps.shadingLanguageVersion.length).toBeGreaterThan(0);
    expect(caps.glVersion.length).toBeGreaterThan(0);
    expect(caps.maxRenderBufferSize).toBeGreaterThanOrEqual(1024);
    expect(caps.maxTextureImageUnits).toBeGreaterThanOrEqual(4);
    expect(caps.maxTextureSize).toBeGreaterThanOrEqual(1024);
    expect(caps.extensions.length).toBeGreaterThan(0);
  });
});
