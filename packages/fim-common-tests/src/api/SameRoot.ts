// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { midpoint } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimError, FimOpCopy, FimOpFill } from '@leosingleton/fim';

/**
 * FIM test cases around ensuring child objects belong to the same root FIM instance
 */
export function fimTestSuiteSameRoot(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM Same Root - ${description}`, () => {

    it('copyFrom() doesn\'t allow copying from another FIM instance', async () => {
      await usingAsync(factory(), async fim1 => {
        await usingAsync(factory(), async fim2 => {
          const image1 = fim1.createImage(TestSizes.smallWide);
          const image2 = fim2.createImage(TestSizes.smallWide, { defaultFillColor: TestColors.red });
          (await expectErrorAsync(image1.copyFromAsync(image2))).toBeInstanceOf(FimError);
        });
      });
    });

    it('executeAsync() doesn\'t allow ops from another FIM instance', async () => {
      await usingAsync(factory(), async fim1 => {
        await usingAsync(factory(), async fim2 => {
          const opFill = new FimOpFill(fim1);
          const output = fim2.createImage(TestSizes.smallWide);
          (await expectErrorAsync(output.executeAsync(opFill.$(TestColors.red)))).toBeInstanceOf(FimError);
        });
      });
    });

    it('executeAsync() doesn\'t allow source images from another FIM instance', async () => {
      await usingAsync(factory(), async fim1 => {
        await usingAsync(factory(), async fim2 => {
          const opCopy = new FimOpCopy(fim1);
          const input = fim2.createImage(TestSizes.smallWide, { defaultFillColor: TestColors.red });
          const output = fim1.createImage(TestSizes.smallWide);
          (await expectErrorAsync(output.executeAsync(opCopy.$(input)))).toBeInstanceOf(FimError);
        });
      });
    });

    it('copyFrom() allows copying from another parent in the same FIM instance', async () => {
      await usingAsync(factory(), async fim => {
        // image2's parent is image1, not root
        const image1 = fim.createImage(TestSizes.smallWide);
        const image2 = fim.createImage(TestSizes.smallWide, { defaultFillColor: TestColors.red }, 'image2', image1);
        await image1.copyFromAsync(image2);
        expect(await image1.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

    it('executeAsync() allows ops from another parent in the same FIM instance', async () => {
      await usingAsync(factory(), async fim => {
        // output's parent is opFill, not root
        const opFill = new FimOpFill(fim);
        const output = fim.createImage(TestSizes.smallWide, {}, 'output', opFill);
        await output.executeAsync(opFill.$(TestColors.red));
        expect(await output.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

    it('executeAsync() allows source images from another parent in the same FIM instance', async () => {
      await usingAsync(factory(), async fim => {
        // output's parent is opCopy, not root
        const opCopy = new FimOpCopy(fim);
        const input = fim.createImage(TestSizes.smallWide, { defaultFillColor: TestColors.red });
        const output = fim.createImage(TestSizes.smallWide, {}, 'output', opCopy);
        await output.executeAsync(opCopy.$(input));
        expect(await output.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

  });
}
