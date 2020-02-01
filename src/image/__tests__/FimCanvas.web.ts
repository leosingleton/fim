// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, _FimCanvas } from '../FimCanvas';
import { FimRgbaBuffer } from '../FimRgbaBuffer';
import { FimWeb } from '../../Fim';
import { FimTestImages } from '../../debug/FimTestImages';
import { FimTestPatterns } from '../../debug/FimTestPatterns';
import { FimRect } from '../../primitives/FimRect';
import { FimColor } from '../../primitives/FimColor';
import { DisposableSet, SeededRandom, using, usingAsync } from '@leosingleton/commonlibs';
import { FimOffscreenCanvasFactory, FimDomCanvasFactory, FimCanvasFactory } from '../FimCanvasFactory';

function spec(canvasFactory: FimCanvasFactory) {
  return () => {
    it('Creates and disposes', () => {
      using(new FimWeb(canvasFactory), fim => {
        const b = fim.createCanvas(640, 480);
        expect(b.getCanvas()).toBeDefined();
        expect(b.offscreenCanvas).toBe(canvasFactory === FimOffscreenCanvasFactory);

        b.dispose();
        expect(b.getCanvas()).toBeUndefined();

        // Double-dispose
        b.dispose();
        expect(b.getCanvas()).toBeUndefined();
      });
    });

    it('Fills with initial value', () => {
      using(new FimWeb(canvasFactory), fim => {
        const color = FimColor.fromString('#abc');
        using(fim.createCanvas(640, 480, color), buffer => {
          expect(buffer.getPixel(134, 413)).toEqual(color);
        });
      });
    });

    it('Gets and sets pixel colors', () => {
      using(new FimWeb(canvasFactory), fim => {
        const color1 = FimColor.fromString('#123');
        const color2 = FimColor.fromString('#aaa');

        using(fim.createCanvas(640, 480, color1), buffer => {
          buffer.setPixel(555, 123, color2);
          expect(buffer.getPixel(134, 413)).toEqual(color1);
          expect(buffer.getPixel(555, 123)).toEqual(color2);
        });
      });
    });

    it('Copies full image', () => {
      using(new FimWeb(canvasFactory), fim => {
        const color1 = FimColor.fromString('#def');
        const color2 = FimColor.fromString('#1234');
        using(fim.createCanvas(640, 480, color1), src => {
          using(fim.createCanvas(640, 480), dest => {
            // Copy src to dest
            dest.copyFrom(src);

            // Modify src
            src.fillCanvas(color2);

            // Ensure dest is still copied from original src
            expect(dest.getPixel(142, 373)).toEqual(color1);
          });
        });
      });
    });

    it('Copies to destination coordinates', () => {
      using(new FimWeb(canvasFactory), fim => {
        using(fim.createCanvas(200, 200), dest => {
          using(fim.createCanvas(100, 100), src => {
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
    });

    /**
     * Generic test case for copying a FimRgbaBuffer to a FimCanvas
     * @param copy Lambda function that performs the copy
     */
    async function copyFromRgbaBuffer(copy: (dest: FimCanvas, src: FimRgbaBuffer) => Promise<void>):
        Promise<void> {
      const rand = new SeededRandom(0);

      // Create an RGBA buffer and fill it with gradiant values
      await DisposableSet.usingAsync(async disposable => {
        const fim = disposable.addDisposable(new FimWeb(canvasFactory));
        const src = disposable.addDisposable(fim.createRgbaBuffer(100, 100));
        for (let x = 0; x < 100; x++) {
          for (let y = 0; y < 100; y++) {
            src.setPixel(x, y, FimColor.fromRGBABytes(x, y, 0, 255));
          }
        }

        // Copy the RGBA buffer to an FimCanvas
        const dest = disposable.addDisposable(fim.createCanvas(100, 100));
        await copy(dest, src);

        // Ensure the two are the same
        for (let n = 0; n < 100; n++) {
          const x = rand.nextInt() % 100;
          const y = rand.nextInt() % 100;

          const srcPixel = FimColor.fromRGBABytes(x, y, 0, 255);
          const destPixel = dest.getPixel(x, y);
          expect(destPixel).toEqual(srcPixel);
        }
      });
    }

    // We need an internal scope like .NET...
    it('Copies from FimRgbaBuffer with ImageBitmap', async () => {
      await copyFromRgbaBuffer((dest, src) => (dest as _FimCanvas).internalCopyFromRgbaBufferWithImageBitmapAsync(src));
    });

    it('Copies from FimRgbaBuffer with PutImageData', async () => {
      await copyFromRgbaBuffer(async (dest, src) => dest.copyFrom(src));
    });

    it('Copies from FimRgbaBuffer with browser detection', async () => {
      await copyFromRgbaBuffer((dest, src) => dest.copyFromAsync(src));
    });

    it('Copies with crop', async () => {
      const rand = new SeededRandom(0);

      await DisposableSet.usingAsync(async disposable => {
        // Create a buffer and fill it with gradient values. For speed, fill an RGBA buffer then copy it to the canvas.
        // FimCanvas.setPixel() is very slow.
        const fim = disposable.addDisposable(new FimWeb(canvasFactory));
        const orig = disposable.addDisposable(fim.createCanvas(300, 300));
        const temp = disposable.addDisposable(fim.createRgbaBuffer(300, 300));
        FimTestPatterns.render(temp, FimTestPatterns.horizontalGradient);
        await orig.copyFrom(temp);

        // Copy the center 100x100 to another buffer
        const crop = disposable.addDisposable(fim.createCanvas(300, 300, '#000'));
        const rect = FimRect.fromXYWidthHeight(100, 100, 100, 100);
        crop.copyFrom(orig, rect, rect);

        // Ensure the pixels were copied by sampling 100 random ones
        for (let n = 0; n < 100; n++) {
          const x = rand.nextInt() % 300;
          const y = rand.nextInt() % 300;

          const cropPixel = crop.getPixel(x, y);

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
      const jpeg = FimTestImages.fourSquaresJpeg();

      // Decompress the image
      await usingAsync(new FimWeb(canvasFactory), async fim => {
        using(await fim.createCanvasFromJpegAsync(jpeg), canvas => {
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

    it('Encodes PNGs', async () => {
      await usingAsync(new FimWeb(canvasFactory), async fim => {
        await usingAsync(fim.createCanvas(320, 320, '#f00'), async canvas => {
          // Write to PNG
          const png = await canvas.toPng();

          // PNG magic number is 89 50 4E 47 (ASCII for .PNG)
          expect(png[0]).toBe(0x89);
          expect(png[1]).toBe(0x50);
          expect(png[2]).toBe(0x4e);
          expect(png[3]).toBe(0x47);
        });
      });
    });

    it('Encodes JPEGs', async () => {
      await usingAsync(new FimWeb(canvasFactory), async fim => {
        await usingAsync(fim.createCanvas(320, 320, '#f00'), async canvas => {
          // Write to JPEG
          const jpeg = await canvas.toJpeg();

          // JPEG magic number is FF D8 FF
          expect(jpeg[0]).toBe(0xff);
          expect(jpeg[1]).toBe(0xd8);
          expect(jpeg[2]).toBe(0xff);
        });
      });
    });
  };
}

describe('FimCanvas(OffscreenCanvas=false)', spec(FimDomCanvasFactory));

// Only run OffscreenCanvas tests on browsers that support it
if (FimWeb.supportsOffscreenCanvas) {
  describe('FimCanvas(OffscreenCanvas=true)', spec(FimOffscreenCanvasFactory));
}
