// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, InternalFimCanvas } from '../FimCanvas';
import { FimRgbaBuffer } from '../FimRgbaBuffer';
import { FimTestImages } from '../../debug/FimTestImages';
import { FimTestPatterns } from '../../debug/FimTestPatterns';
import { FimRect } from '../../primitives/FimRect';
import { FimColor } from '../../primitives/FimColor';
import { DisposableSet, SeededRandom, using, usingAsync } from '@leosingleton/commonlibs';

function spec(useOffscreenCanvas: boolean) {
  return () => {
    it('Creates and disposes', () => {
      let b = new FimCanvas(640, 480, undefined, useOffscreenCanvas);
      expect(b.getCanvas()).toBeDefined();
      expect(b.offscreenCanvas).toBe(useOffscreenCanvas);

      b.dispose();
      expect(b.getCanvas()).toBeUndefined();

      // Double-dispose
      b.dispose();
      expect(b.getCanvas()).toBeUndefined();
    });

    it('Fills with initial value', () => {
      let color = FimColor.fromString('#abc');
      using(new FimCanvas(640, 480, color, useOffscreenCanvas), buffer => {
        expect(buffer.getPixel(134, 413)).toEqual(color);
      });
    });

    it('Gets and sets pixel colors', () => {
      let color1 = FimColor.fromString('#123');
      let color2 = FimColor.fromString('#aaa');

      using(new FimCanvas(640, 480, color1, useOffscreenCanvas), buffer => {
        buffer.setPixel(555, 123, color2);
        expect(buffer.getPixel(134, 413)).toEqual(color1);
        expect(buffer.getPixel(555, 123)).toEqual(color2);
      });
    });

    it('Copies full image', () => {
      let color1 = FimColor.fromString('#def');
      let color2 = FimColor.fromString('#1234');
      using(new FimCanvas(640, 480, color1, useOffscreenCanvas), src => {
        using(new FimCanvas(640, 480, undefined, useOffscreenCanvas), dest => {
          // Copy src to dest
          dest.copyFrom(src);

          // Modify src
          src.fillCanvas(color2);

          // Ensure dest is still copied from original src
          expect(dest.getPixel(142, 373)).toEqual(color1);
        });
      });
    });

    it('Copies to destination coordinates', () => {
      using(new FimCanvas(200, 200, undefined, useOffscreenCanvas), dest => {
        using(new FimCanvas(100, 100, undefined, useOffscreenCanvas), src => {
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
    async function copyFromRgbaBuffer(copy: (dest: InternalFimCanvas, src: FimRgbaBuffer) => Promise<void>):
        Promise<void> {
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
        let dest = disposable.addDisposable(new InternalFimCanvas(100, 100, undefined, useOffscreenCanvas));
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
    it('Copies from FimRgbaBuffer with ImageBitmap', async () => {
      await copyFromRgbaBuffer((dest, src) => dest.internalCopyFromRgbaBufferWithImageBitmapAsync(src));
    });

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
        let orig = disposable.addDisposable(new FimCanvas(300, 300, undefined, useOffscreenCanvas));
        let temp = disposable.addDisposable(new FimRgbaBuffer(300, 300));
        FimTestPatterns.render(temp, FimTestPatterns.horizontalGradient);
        await orig.copyFrom(temp);
    
        // Copy the center 100x100 to another buffer
        let crop = disposable.addDisposable(new FimCanvas(300, 300, '#000', useOffscreenCanvas));
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
      using(await FimCanvas.createFromJpeg(jpeg, useOffscreenCanvas), canvas => {
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

    it('Encodes JPEGs', async () => {
      await usingAsync(new FimCanvas(320, 320, '#f00', useOffscreenCanvas), async canvas => {
        // Write to JPEG
        let jpeg = await canvas.toJpeg();

        // JPEG magic number is FF D8 FF
        expect(jpeg[0]).toBe(0xff);
        expect(jpeg[1]).toBe(0xd8);
        expect(jpeg[2]).toBe(0xff);
      });
    });
  };
}

describe('FimCanvas(OffscreenCanvas=false)', spec(false));

// Only run OffscreenCanvas tests on browsers that support it
if (FimCanvas.supportsOffscreenCanvas) {
  describe('FimCanvas(OffscreenCanvas=true)', spec(true));
}
