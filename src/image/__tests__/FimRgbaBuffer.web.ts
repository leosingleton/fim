// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGreyscaleBuffer } from '../FimGreyscaleBuffer';
import { FimRgbaBuffer } from '../FimRgbaBuffer';
import { Fim } from '../../Fim';
import { FimColor } from '../../primitives/FimColor';
import { FimRect } from '../../primitives/FimRect';
import { SeededRandom, using, DisposableSet } from '@leosingleton/commonlibs';

describe('FimRgbaBuffer', () => {

  it('Creates and disposes', () => {
    using(new Fim(), fim => {
      let b = new FimRgbaBuffer(fim, 640, 480);
      expect(b.getBuffer().length).toEqual(640 * 480 * 4);
  
      b.dispose();
      expect(b.getBuffer()).toBeUndefined();
  
      // Double-dispose
      b.dispose();
      expect(b.getBuffer()).toBeUndefined();  
    });
  });

  it('Fills with initial value', () => {
    using(new Fim(), fim => {
      let color = FimColor.fromString('#abc');
      using(new FimRgbaBuffer(fim, 640, 480, color), buffer => {
        expect(buffer.getPixel(134, 413)).toEqual(color);
      });  
    });
  });

  it('Gets and sets pixel colors', () => {
    using(new Fim(), fim => {
      let color1 = FimColor.fromString('#123');
      let color2 = FimColor.fromString('#aaa');
  
      using(new FimRgbaBuffer(fim, 640, 480, color1), buffer => {
        buffer.setPixel(555, 123, color2);
        expect(buffer.getPixel(134, 413)).toEqual(color1);
        expect(buffer.getPixel(555, 123)).toEqual(color2);
      });
    });
  });

  it('Copies full image', () => {
    let color1 = FimColor.fromString('#def');
    let color2 = FimColor.fromString('#1234');

    DisposableSet.using(disposable => {
      let fim = disposable.addDisposable(new Fim());
      let src = disposable.addDisposable(new FimRgbaBuffer(fim, 640, 480, color1));
      let dest = disposable.addDisposable(new FimRgbaBuffer(fim, 640, 480));

      // Copy src to dest
      dest.copyFrom(src);

      // Modify src
      src.fillCanvas(color2)

      // Ensure dest is still copied from original src
      expect(dest.getPixel(142, 373)).toEqual(color1);
    });
  });

  it('Copies to destination coordinates', () => {
    DisposableSet.using(disposable => {
      let fim = disposable.addDisposable(new Fim());
      let dest = disposable.addDisposable(new FimRgbaBuffer(fim, 200, 200));
      let src = disposable.addDisposable(new FimRgbaBuffer(fim, 100, 100));

      // Top-left => red
      src.fillCanvas('#f00');
      dest.copyFrom(src, src.imageDimensions, FimRect.fromXYWidthHeight(0, 0, 100, 100));

      // Top-right => green
      src.fillCanvas('#0f0');
      dest.copyFrom(src, src.imageDimensions, FimRect.fromXYWidthHeight(100, 0, 100, 100));

      // Bottom-left => blue
      src.fillCanvas('#00f');
      dest.copyFrom(src, src.imageDimensions, FimRect.fromXYWidthHeight(0, 100, 100, 100));

      // Bottom-right => white
      src.fillCanvas('#fff');
      dest.copyFrom(src, src.imageDimensions, FimRect.fromXYWidthHeight(100, 100, 100, 100));

      // Check a pixel in each of the four quadrants for the expected color
      expect(dest.getPixel(50, 50)).toEqual(FimColor.fromString('#f00'));
      expect(dest.getPixel(150, 50)).toEqual(FimColor.fromString('#0f0'));
      expect(dest.getPixel(50, 150)).toEqual(FimColor.fromString('#00f'));
      expect(dest.getPixel(150, 150)).toEqual(FimColor.fromString('#fff'));
    });
  });

  it('Copies with crop', () => {
    let rand = new SeededRandom(0);

    DisposableSet.using(disposable => {
      let fim = disposable.addDisposable(new Fim());

      // Create a buffer and fill it with random values
      let orig = disposable.addDisposable(new FimRgbaBuffer(fim, 300, 300));
      let buffer = orig.getBuffer();
      for (let n = 0; n < buffer.length; n++) {
        buffer[n] = rand.nextInt() % 256;
      }
  
      // Copy the center 100x100 to another buffer
      let crop = disposable.addDisposable(new FimRgbaBuffer(fim, 300, 300, '#000'));
      let rect = FimRect.fromXYWidthHeight(100, 100, 100, 100);
      crop.copyFrom(orig, rect, rect);
  
      // Ensure the pixels were copied by sampling 100 random ones
      for (let n = 0; n < 100; n++) {
        let x = rand.nextInt() % 300;
        let y = rand.nextInt() % 300;
  
        let origPixel = orig.getPixel(x, y);
        let cropPixel = crop.getPixel(x, y);
  
        if (x < 100 || x >= 200 || y < 100 || y >= 200) {
          // All 0 values for pixels outside of the copied area
          expect(cropPixel).toEqual(FimColor.fromString('#000'));
        } else {
          // Copied area
          expect(cropPixel).toEqual(origPixel);
        }
      }
    });
  });

  it('Copies from FimGreyscaleBuffer', () => {
    DisposableSet.using(disposable => {
      let fim = disposable.addDisposable(new Fim());
      let dest = disposable.addDisposable(new FimRgbaBuffer(fim, 200, 200));
      let src = disposable.addDisposable(new FimGreyscaleBuffer(fim, 100, 100));

      // Top-left => 0x00
      src.fillCanvas(0x00);
      dest.copyFrom(src, src.imageDimensions, FimRect.fromXYWidthHeight(0, 0, 100, 100));

      // Top-right => 0x33
      src.fillCanvas(0x33);
      dest.copyFrom(src, src.imageDimensions, FimRect.fromXYWidthHeight(100, 0, 100, 100));

      // Bottom-left => 0x66
      src.fillCanvas(0x66);
      dest.copyFrom(src, src.imageDimensions, FimRect.fromXYWidthHeight(0, 100, 100, 100));

      // Bottom-right => 0x99
      src.fillCanvas(0x99);
      dest.copyFrom(src, src.imageDimensions, FimRect.fromXYWidthHeight(100, 100, 100, 100));

      // Check a pixel in each of the four quadrants for the expected color
      expect(dest.getPixel(50, 50)).toEqual(FimColor.fromString('#000'));
      expect(dest.getPixel(150, 50)).toEqual(FimColor.fromString('#333'));
      expect(dest.getPixel(50, 150)).toEqual(FimColor.fromString('#666'));
      expect(dest.getPixel(150, 150)).toEqual(FimColor.fromString('#999'));
    });
  });

});
