// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from '../FimCanvas';
import { SeededRandom, using, usingAsync } from '@leosingleton/commonlibs';
import { FimRect, FimColor } from '../../primitives';
import { FimRgbaBuffer } from '../FimRgbaBuffer';

describe('FimCanvas', () => {

  it('Creates and disposes', () => {
    let b = new FimCanvas(640, 480);
    expect(b.getCanvas()).toBeDefined();

    b.dispose();
    expect(b.getCanvas()).toBeUndefined();

    // Double-dispose
    b.dispose();
    expect(b.getCanvas()).toBeUndefined();
  });

  it('Fills with initial value', () => {
    let color = FimColor.fromString('#abc');
    using(new FimCanvas(640, 480, color), buffer => {
      expect(buffer.getPixel(134, 413)).toEqual(color);
    });
  });

  it('Copies full image', () => {
    let color1 = FimColor.fromString('#def');
    let color2 = FimColor.fromString('#1234');
    using(new FimCanvas(640, 480, color1), src => {
      using(new FimCanvas(640, 480), dest => {
        // Copy src to dest
        dest.copyFromCanvas(src);

        // Modify src
        src.fill(color2)

        // Ensure dest is still copied from original src
        expect(dest.getPixel(142, 373)).toEqual(color1);
      });
    });
  });

  it('Copies to destination coordinates', () => {
    using(new FimCanvas(200, 200), dest => {
      using(new FimCanvas(100, 100), src => {
        // Top-left => red
        src.fill('#f00');
        dest.copyFromCanvas(src, src.dimensions, FimRect.fromXYWidthHeight(0, 0, 100, 100));

        // Top-right => green
        src.fill('#0f0');
        dest.copyFromCanvas(src, src.dimensions, FimRect.fromXYWidthHeight(100, 0, 100, 100));

        // Bottom-left => blue
        src.fill('#00f');
        dest.copyFromCanvas(src, src.dimensions, FimRect.fromXYWidthHeight(0, 100, 100, 100));

        // Bottom-right => white
        src.fill('#fff');
        dest.copyFromCanvas(src, src.dimensions, FimRect.fromXYWidthHeight(100, 100, 100, 100));
      });

      // Check a pixel in each of the four quadrants for the expected color
      expect(dest.getPixel(50, 50)).toEqual(FimColor.fromString('#f00'));
      expect(dest.getPixel(150, 50)).toEqual(FimColor.fromString('#0f0'));
      expect(dest.getPixel(50, 150)).toEqual(FimColor.fromString('#00f'));
      expect(dest.getPixel(150, 150)).toEqual(FimColor.fromString('#fff'));
    });
  });

  /**
   * Generic test case for copying a FimRgbaBuffer to a FimCanvas
   * @param copy Lambda function that performs the copy
   */
  async function copyFromRgbaBuffer(copy: (dest: FimCanvas, src: FimRgbaBuffer) => Promise<void>): Promise<void> {
    let rand = new SeededRandom(0);

    // Create an RGBA buffer and fill it with gradiant values
    await usingAsync(new FimRgbaBuffer(100, 100), async src => {
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          src.setPixel(x, y, FimColor.fromRGBABytes(x, y, 0, 255));
        }
      }

      // Copy the RGBA buffer to an FimCanvas
      await usingAsync(new FimCanvas(100, 100), async dest => {
        await copy(dest, src);

        // Ensure the two are the same
        for (let n = 0; n < 100; n++) {
          let x = rand.nextInt() % 100;
          let y = rand.nextInt() % 100;

          let srcPixel = FimColor.fromRGBABytes(x, y, 0, 255);
          let destPixel = dest.getPixel(x, y);
          expect(destPixel).toEqual(srcPixel);
        }
      });
    });        
  }

  it('Copies from FimRgbaBuffer with ImageBitmap', async () => {
    await copyFromRgbaBuffer((dest, src) => dest.copyFromRgbaBufferWithImageBitmap(src));
  });

  it('Copies from FimRgbaBuffer with PutImageData', async () => {
    await copyFromRgbaBuffer(async (dest, src) => dest.copyFromRgbaBufferWithPutImageData(src));
  });

  it('Copies from FimRgbaBuffer with browser detection', async () => {
    await copyFromRgbaBuffer((dest, src) => dest.copyFromRgbaBuffer(src));
  });

  /*
  it('Copies with crop', () => {
    let rand = new SeededRandom(0);

    // Create a buffer and fill it with random values
    using (new FimCanvas(300, 300), orig => {
      // We can't directly write to a canvas, so use a temporary RGBA buffer
      using (new FimRgbaBuffer(300, 300), temp => {
        let buffer = temp.getBuffer();
        for (let n = 0; n < buffer.length; n++) {
          buffer[n] = rand.nextInt() % 256;
        }
        orig.copyFromRgbaBuffer(temp);
      });
  
      // Copy the center 100x100 to another buffer
      using (new FimCanvas(300, 300, '#000'), crop => {
        let rect = FimRect.fromXYWidthHeight(100, 100, 100, 100);
        crop.copyFromCanvas(orig, rect, rect);
    
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
  */

});
