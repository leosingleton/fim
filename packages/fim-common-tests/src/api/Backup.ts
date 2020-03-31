// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestImages } from '../common/TestImages';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimOpInvert } from '@leosingleton/fim';

/** FIM test cases around backing up WebGL textures to canvases */
export function fimTestSuiteBackup(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM Backup - ${description}`, () => {

    it('Backs up with explicit calls to backupAsync()', async () => {
      await usingAsync(factory(TestSizes.smallFourSquares), async fim => {
        // Load an image
        const png = TestImages.fourSquaresPng();
        const image = await fim.createImageFromPngAsync(png);

        // Backup is a no-op when there is no WebGL texture
        await image.backupAsync();
        expect((image as any).contentCanvas.isCurrent).toBeTruthy();
        expect((image as any).contentTexture.isCurrent).toBeFalsy();

        // Run an invert operation to make the current copy a WebGL texture
        const opInvert = new FimOpInvert(fim);
        opInvert.setInput(image);
        await image.executeAsync(opInvert);
        expect((image as any).contentCanvas.isCurrent).toBeFalsy();
        expect((image as any).contentTexture.isCurrent).toBeTruthy();

        // Backup the WebGL texture to a canvas
        await image.backupAsync();
        expect((image as any).contentCanvas.isCurrent).toBeTruthy();
        expect((image as any).contentTexture.isCurrent).toBeTruthy();
      });
    });

    it('Backs up automatically with imageOptions.backup', async () => {
      await usingAsync(factory(TestSizes.smallFourSquares), async fim => {
        // Load an image and enable auto-backup
        const png = TestImages.fourSquaresPng();
        const image = await fim.createImageFromPngAsync(png, { backup: true });
        expect((image as any).contentCanvas.isCurrent).toBeTruthy();
        expect((image as any).contentTexture.isCurrent).toBeFalsy();

        // Run an invert operation to make the current copy a WebGL texture. The texture is automatically backed up.
        const opInvert = new FimOpInvert(fim);
        opInvert.setInput(image);
        await image.executeAsync(opInvert);
        expect((image as any).contentCanvas.isCurrent).toBeTruthy();
        expect((image as any).contentTexture.isCurrent).toBeTruthy();
      });
    });

  });
}
