// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { midpoint } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { Fim, FimDimensions, FimImage, FimObject, FimOperation, FimRect } from '@leosingleton/fim';
import { usingAsync } from '@leosingleton/commonlibs';

/** Mock operation for unit tests that performs a solid red fill. This is pretty useless, but good to test with. */
class MockOpFillRed extends FimOperation {
  public constructor(parent: FimObject) {
    super(parent, 'MockFillRed');
  }

  public async executeAsync(outputImage: FimImage, _destCoords?: FimRect): Promise<void> {
    await outputImage.fillSolidAsync(TestColors.red);
  }
}

/** Mock operation for unit tests which builds on top of `MockOpParent` */
class MockOpFillRedChild extends FimOperation {
  public constructor(parent: FimObject) {
    super(parent, 'MockFillRedChild');
    this.opFillRed = new MockOpFillRed(this);
  }

  private readonly opFillRed: MockOpFillRed;

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return outputImage.executeAsync(this.opFillRed, destCoords);
  }
}

/** Mock operation for unit tests which builds on top of `MockOpChild` */
class MockOpFillRedGrandchild extends FimOperation {
  public constructor(parent: FimObject) {
    super(parent, 'MockFillRedGrandchild');
    this.opFillRedChild = new MockOpFillRedChild(this);
  }

  private readonly opFillRedChild: MockOpFillRedChild;

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return outputImage.executeAsync(this.opFillRedChild, destCoords);
  }
}

/** Unit tests for operations which don't warrant their own class/file */
export function fimTestSuiteOpMisc(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FimOpMisc - ${description}`, () => {

    it('Executes a simple mock operation', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const fillOp = new MockOpFillRed(fim);
        const image = fim.createImage();
        await image.executeAsync(fillOp);
        expect(await image.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.red);
      });
    });

    it('Executes a child operation built on another operation', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const fillOp = new MockOpFillRedChild(fim);
        const image = fim.createImage();
        await image.executeAsync(fillOp);
        expect(await image.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.red);
      });
    });

    it('Executes a grandchild operation built on a child operation', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const fillOp = new MockOpFillRedGrandchild(fim);
        const image = fim.createImage();
        await image.executeAsync(fillOp);
        expect(await image.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.red);
      });
    });

  });
}
