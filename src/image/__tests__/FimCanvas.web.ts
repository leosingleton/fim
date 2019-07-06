// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from '../FimCanvas';
import { FimRgbaBuffer } from '../FimRgbaBuffer';
import { SeededRandom, using, DisposableSet } from '@leosingleton/commonlibs';
import { FimRect, FimColor } from '../../primitives';
import { FimTestPatterns, FimTestImages } from '../../test';

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

  it('Gets and sets pixel colors', () => {
    let color1 = FimColor.fromString('#123');
    let color2 = FimColor.fromString('#aaa');

    using(new FimCanvas(640, 480, color1), buffer => {
      buffer.setPixel(555, 123, color2);
      expect(buffer.getPixel(134, 413)).toEqual(color1);
      expect(buffer.getPixel(555, 123)).toEqual(color2);
    });
  });

  it('Copies full image', () => {
    let color1 = FimColor.fromString('#def');
    let color2 = FimColor.fromString('#1234');
    using(new FimCanvas(640, 480, color1), src => {
      using(new FimCanvas(640, 480), dest => {
        // Copy src to dest
        dest.copyFrom(src);

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
        dest.copyFrom(src, src.dimensions, FimRect.fromXYWidthHeight(0, 0, 100, 100));

        // Top-right => green
        src.fill('#0f0');
        dest.copyFrom(src, src.dimensions, FimRect.fromXYWidthHeight(100, 0, 100, 100));

        // Bottom-left => blue
        src.fill('#00f');
        dest.copyFrom(src, src.dimensions, FimRect.fromXYWidthHeight(0, 100, 100, 100));

        // Bottom-right => white
        src.fill('#fff');
        dest.copyFrom(src, src.dimensions, FimRect.fromXYWidthHeight(100, 100, 100, 100));
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
    await DisposableSet.usingAsync(async disposable => {
      let src = disposable.addDisposable(new FimRgbaBuffer(100, 100));
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          src.setPixel(x, y, FimColor.fromRGBABytes(x, y, 0, 255));
        }
      }

      // Copy the RGBA buffer to an FimCanvas
      let dest = disposable.addDisposable(new FimCanvas(100, 100));
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
  }

  // We need an internal scope like .NET...
  //it('Copies from FimRgbaBuffer with ImageBitmap', async () => {
  //  await copyFromRgbaBuffer((dest, src) => dest.copyFromRgbaBufferWithImageBitmapAsync(src));
  //});

  it('Copies from FimRgbaBuffer with PutImageData', async () => {
    await copyFromRgbaBuffer(async (dest, src) => dest.copyFrom(src));
  });

  it('Copies from FimRgbaBuffer with browser detection', async () => {
    await copyFromRgbaBuffer((dest, src) => dest.copyFromAsync(src));
  });

  it('Copies with crop', async () => {
    let rand = new SeededRandom(0);

    await DisposableSet.usingAsync(async disposable => {
      // Create a buffer and fill it with gradient values. For speed, fill an RGBA buffer then copy it to the canvas.
      // FimCanvas.setPixel() is very slow.
      let orig = disposable.addDisposable(new FimCanvas(300, 300));
      let temp = disposable.addDisposable(new FimRgbaBuffer(300, 300));
      FimTestPatterns.render(temp, FimTestPatterns.horizontalGradient);
      await orig.copyFrom(temp);
  
      // Copy the center 100x100 to another buffer
      let crop = disposable.addDisposable(new FimCanvas(300, 300, '#000'));
      let rect = FimRect.fromXYWidthHeight(100, 100, 100, 100);
      crop.copyFrom(orig, rect, rect);
  
      // Ensure the pixels were copied by sampling 100 random ones
      for (let n = 0; n < 100; n++) {
        let x = rand.nextInt() % 300;
        let y = rand.nextInt() % 300;
  
        let cropPixel = crop.getPixel(x, y);
  
        if (x < 100 || x >= 200 || y < 100 || y >= 200) {
          // All 0 values for pixels outside of the copied area
          expect(cropPixel).toEqual(FimColor.fromString('#000'));
        } else {
          // Copied area
          expect(cropPixel).toEqual(FimTestPatterns.horizontalGradient(x, y));
        }
      }
    });
  });

  it('Decodes JPEGs', async () => {
    let jpeg = FimTestImages.fourSquaresJpeg();

    // Decompress the image
    using(await FimCanvas.createFromJpeg(jpeg), canvas => {
      expect(canvas.w).toEqual(128);
      expect(canvas.h).toEqual(128);

      function expectToBeCloseTo(actual: FimColor, expected: FimColor): void {
        expect(actual.r).toBeCloseTo(expected.r, -0.5);
        expect(actual.g).toBeCloseTo(expected.g, -0.5);
        expect(actual.b).toBeCloseTo(expected.b, -0.5);  
        expect(actual.a).toBeCloseTo(expected.a, -0.5);  
      }

      expectToBeCloseTo(canvas.getPixel(32, 32), FimColor.fromString('#f00'));
      expectToBeCloseTo(canvas.getPixel(96, 32), FimColor.fromString('#0f0'));
      expectToBeCloseTo(canvas.getPixel(32, 96), FimColor.fromString('#00f'));
      expectToBeCloseTo(canvas.getPixel(96, 96), FimColor.fromString('#000'));
    });
  });

});
