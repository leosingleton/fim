// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { small, medium } from '../common/Globals';
import { TestPatterns } from '../common/TestPatterns';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimRect } from '@leosingleton/fim';

/** Oversized for Fim */
export function fimTestSuiteOversized(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim Oversized - ${description}`, () => {

    it('Downscales images larger than parent FIM', () => {
      using(factory(small), fim => {
        const image = fim.createImage({}, medium);
        const eff = image.getEffectiveImageOptions();

        // Y-axis to get downscaled from 640 to 50 pixels
        expect(eff.downscale).toEqual(50 / 640);
        expect(eff.glDownscale).toEqual(50 / 640);
      });
    });

    it('Supports allowOversized image option', () => {
      using(factory(small), fim => {
        const image = fim.createImage({ allowOversized: true }, medium);
        const eff = image.getEffectiveImageOptions();

        // No downscale occurs
        expect(eff.downscale).toEqual(1);
        expect(eff.glDownscale).toEqual(1);
      });
    });

    it('Supports custom downscale ratios', () => {
      using(factory(medium), fim => {
        const image = fim.createImage({
          downscale: 0.5,
          glDownscale: 0.05
        }, medium);
        const eff = image.getEffectiveImageOptions();

        // Downscale matches image options as FIM and image have same dimensions
        expect(eff.downscale).toEqual(0.5);
        expect(eff.glDownscale).toEqual(0.05);
      });
    });

    it('Import and export accept original dimensions', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage({}, medium);

        // renderAsync() uses the image's dimensions (medium)
        await TestPatterns.renderAsync(image, TestPatterns.horizontalGradient);

        // Exports at the image's dimensions (medium) despite being downscaled to the FIM size (small)
        const pixelData1 = await image.exportToPixelDataAsync();
        expect(pixelData1.length).toEqual(medium.getArea() * 4);

        // Accepts srcCoords too
        const dim = FimRect.fromXYWidthHeight(10, 10, 240, 240);
        const pixelData2 = await image.exportToPixelDataAsync(dim);
        expect(pixelData2.length).toEqual(dim.getArea() * 4);
      });
    });

  });
}
