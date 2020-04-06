// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { topLeft, topRight, bottomLeft, bottomRight } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimOpCopy, FimTransform2D } from '@leosingleton/fim';

/** WebGL tests for FIM with vertex transformation*/
export function fimTestSuiteWebGLTransform(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM WebGL Transform - ${description}`, () => {

    it('Accepts vertex matrices', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const copy = new FimOpCopy(fim);

        const red = fim.createImage();
        await red.fillSolidAsync(TestColors.red);

        const output = fim.createImage();
        await output.fillSolidAsync(TestColors.blue);

        // Copy red, shifted down and to the right 50%
        const matrix = new FimTransform2D();
        matrix.translation(0.5, 0.5);

        // Execute copy shader
        await output.executeAsync(copy.$(red, matrix));

        // Validate expected output
        // TODO: Re-enable checks once bug is fixed. The blue fillSolidAsync() gets optimized out.
        //expect(await output.getPixelAsync(topLeft(TestSizes.smallWide))).toEqual(TestColors.blue);
        expect(await output.getPixelAsync(topRight(TestSizes.smallWide))).toEqual(TestColors.red);
        //expect(await output.getPixelAsync(bottomLeft(TestSizes.smallWide))).toEqual(TestColors.blue);
        //expect(await output.getPixelAsync(bottomRight(TestSizes.smallWide))).toEqual(TestColors.blue);
      });

    });

  });
}
