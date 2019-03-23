// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimRgbaBuffer } from '../FimRgbaBuffer';
import { SeededRandom, using } from '@leosingleton/commonlibs';
import { FimRect, FimColor } from '../../primitives';

describe('FimRgbaBuffer', () => {

  it('Creates and disposes', () => {
    let b = new FimRgbaBuffer(640, 480);
    expect(b.getBuffer().length).toEqual(640 * 480 * 4);

    b.dispose();
    expect(b.getBuffer()).toBeUndefined();

    // Double-dispose
    b.dispose();
    expect(b.getBuffer()).toBeUndefined();
  });

  it('Fills with initial value', () => {
    let color = FimColor.fromString('#abc');
    using(new FimRgbaBuffer(640, 480, color), buffer => {
      expect(buffer.getPixel(134, 413)).toEqual(color);
    });
  });

  it('Gets and sets pixel colors', () => {
    let color1 = FimColor.fromString('#123');
    let color2 = FimColor.fromString('#aaa');

    using(new FimRgbaBuffer(640, 480, color1), buffer => {
      buffer.setPixel(555, 123, color2);
      expect(buffer.getPixel(134, 413)).toEqual(color1);
      expect(buffer.getPixel(555, 123)).toEqual(color2);
    });
  });

  it('Copies full image', () => {
    let color1 = FimColor.fromString('#def');
    let color2 = FimColor.fromString('#1234');
    using(new FimRgbaBuffer(640, 480, color1), src => {
      using(new FimRgbaBuffer(640, 480), dest => {
        // Copy src to dest
        dest.copyFromRgbaBuffer(src);

        // Modify src
        src.fill(color2)

        // Ensure dest is still copied from original src
        expect(dest.getPixel(142, 373)).toEqual(color1);
      });
    });
  });

  it('Copies to destination coordinates', () => {
    using(new FimRgbaBuffer(200, 200), dest => {
      using(new FimRgbaBuffer(100, 100), src => {
        // Top-left => red
        src.fill('#f00');
        dest.copyFromRgbaBuffer(src, src.dimensions, FimRect.fromXYWidthHeight(0, 0, 100, 100));

        // Top-right => green
        src.fill('#0f0');
        dest.copyFromRgbaBuffer(src, src.dimensions, FimRect.fromXYWidthHeight(100, 0, 100, 100));

        // Bottom-left => blue
        src.fill('#00f');
        dest.copyFromRgbaBuffer(src, src.dimensions, FimRect.fromXYWidthHeight(0, 100, 100, 100));

        // Bottom-right => white
        src.fill('#fff');
        dest.copyFromRgbaBuffer(src, src.dimensions, FimRect.fromXYWidthHeight(100, 100, 100, 100));
      });

      // Check a pixel in each of the four quadrants for the expected color
      expect(dest.getPixel(50, 50)).toEqual(FimColor.fromString('#f00'));
      expect(dest.getPixel(150, 50)).toEqual(FimColor.fromString('#0f0'));
      expect(dest.getPixel(50, 150)).toEqual(FimColor.fromString('#00f'));
      expect(dest.getPixel(150, 150)).toEqual(FimColor.fromString('#fff'));
    });
  });

  it('Copies with crop', () => {
    let rand = new SeededRandom(0);

    // Create a buffer and fill it with random values
    using(new FimRgbaBuffer(300, 300), orig => {
      let buffer = orig.getBuffer();
      for (let n = 0; n < buffer.length; n++) {
        buffer[n] = rand.nextInt() % 256;
      }
  
      // Copy the center 100x100 to another buffer
      using(new FimRgbaBuffer(300, 300, '#000'), crop => {
        let rect = FimRect.fromXYWidthHeight(100, 100, 100, 100);
        crop.copyFromRgbaBuffer(orig, rect, rect);
    
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
  });

});
