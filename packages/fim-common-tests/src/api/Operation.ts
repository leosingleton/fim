// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { midpoint, red, small } from '../common/Globals';
import { Fim, FimDimensions, FimImage, FimOperation, FimRect } from '@leosingleton/fim';
import { usingAsync } from '@leosingleton/commonlibs';

/** Mock operation for unit tests that performs a solid red fill. This is pretty useless, but good to test with. */
class MockOpFillRed extends FimOperation {
  public constructor(fim: Fim) {
    super(fim, 'MockFillRed');
  }

  public async executeAsync(outputImage: FimImage, _destCoords?: FimRect): Promise<void> {
    await outputImage.fillSolidAsync(red);
  }
}

/** Mock operation for unit tests which builds on top of `MockOpParent` */
class MockOpFillRedChild extends FimOperation {
  public constructor(fim: Fim) {
    super(fim, 'MockFillRedChild');

    this.opFillRed = new MockOpFillRed(fim);
    this.registerChildObject(this.opFillRed);
  }

  private readonly opFillRed: MockOpFillRed;

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return outputImage.executeAsync(this.opFillRed, destCoords);
  }
}

/** Mock operation for unit tests which builds on top of `MockOpChild` */
class MockOpFillRedGrandchild extends FimOperation {
  public constructor(fim: Fim) {
    super(fim, 'MockFillRedGrandchild');

    this.opFillRedChild = new MockOpFillRedChild(fim);
    this.registerChildObject(this.opFillRedChild);
  }

  private readonly opFillRedChild: MockOpFillRedChild;

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    return outputImage.executeAsync(this.opFillRedChild, destCoords);
  }
}

/** Unit tests for `FimOperation` */
export function fimTestSuiteOperation(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FimOperation - ${description}`, () => {

    it('Executes a simple mock operation', async () => {
      await usingAsync(factory(small), async fim => {
        const fillOp = new MockOpFillRed(fim);
        const image = fim.createImage();
        await image.executeAsync(fillOp);
        expect(await image.getPixelAsync(midpoint(small))).toEqual(red);
      });
    });

    it('Executes a child operation built on another operation', async () => {
      await usingAsync(factory(small), async fim => {
        const fillOp = new MockOpFillRedChild(fim);
        const image = fim.createImage();
        await image.executeAsync(fillOp);
        expect(await image.getPixelAsync(midpoint(small))).toEqual(red);
      });
    });

    // BUGBUG: dispose() is currently broken with grandchild operations. Need to investigate this test case.
    xit('Executes a grandchild operation built on a child operation', async () => {
      await usingAsync(factory(small), async fim => {
        const fillOp = new MockOpFillRedGrandchild(fim);
        const image = fim.createImage();
        await image.executeAsync(fillOp);
        expect(await image.getPixelAsync(midpoint(small))).toEqual(red);
      });
    });

  });
}
