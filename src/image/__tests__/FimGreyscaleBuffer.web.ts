// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGreyscaleBuffer } from '../FimGreyscaleBuffer';
import { using, DisposableSet } from '@leosingleton/commonlibs';
import { FimRect } from '../../primitives';

describe('FimGreyscaleBuffer', () => {

  it('Creates and disposes', () => {
    let b = new FimGreyscaleBuffer(640, 480);
    expect(b.getBuffer().length).toEqual(640 * 480);

    b.dispose();
    expect(b.getBuffer()).toBeUndefined();

    // Double-dispose
    b.dispose();
    expect(b.getBuffer()).toBeUndefined();
  });

  it('Fills with initial value', () => {
    using(new FimGreyscaleBuffer(640, 480, 42), buffer => {
      expect(buffer.getPixel(134, 413)).toEqual(42);
    });
  });

  it('Gets and sets pixel colors', () => {
    using(new FimGreyscaleBuffer(640, 480, 12), buffer => {
      buffer.setPixel(555, 123, 233);
      expect(buffer.getPixel(134, 413)).toEqual(12);
      expect(buffer.getPixel(555, 123)).toEqual(233);
    });
  });

  it('Copies to destination coordinates', () => {
    DisposableSet.using(disposable => {
      let dest = disposable.addDisposable(new FimGreyscaleBuffer(200, 200));
      let src = disposable.addDisposable(new FimGreyscaleBuffer(100, 100));

      // Top-left => 0
      src.fill(0);
      dest.copyFrom(src, src.dimensions, FimRect.fromXYWidthHeight(0, 0, 100, 100));

      // Top-right => 50
      src.fill(50);
      dest.copyFrom(src, src.dimensions, FimRect.fromXYWidthHeight(100, 0, 100, 100));

      // Bottom-left => 100
      src.fill(100);
      dest.copyFrom(src, src.dimensions, FimRect.fromXYWidthHeight(0, 100, 100, 100));

      // Bottom-right => 150
      src.fill(150);
      dest.copyFrom(src, src.dimensions, FimRect.fromXYWidthHeight(100, 100, 100, 100));

      // Check a pixel in each of the four quadrants for the expected color
      expect(dest.getPixel(50, 50)).toEqual(0);
      expect(dest.getPixel(150, 50)).toEqual(50);
      expect(dest.getPixel(50, 150)).toEqual(100);
      expect(dest.getPixel(150, 150)).toEqual(150);
    });
  });

});