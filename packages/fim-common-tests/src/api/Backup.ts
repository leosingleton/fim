// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageInternals } from '../common/ImageInternals';
import { TestImages } from '../common/TestImages';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimOpInvert } from '@leosingleton/fim';

/** FIM test cases around backing up WebGL textures to canvases */
export function fimTestSuiteBackup(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM Backup - ${description}`, () => {

    it('Backs up with explicit calls to backupAsync()', async () => {
      await usingAsync(factory(), async fim => {
        const invert = new FimOpInvert(fim);

        // Load an image
        const image = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());

        // Backup is a no-op when there is no WebGL texture
        await image.backupAsync();
        expect(ImageInternals.hasCanvas(image)).toBeTruthy();
        expect(ImageInternals.hasTexture(image)).toBeFalsy();

        // Run an invert operation to make the current copy a WebGL texture
        await image.executeAsync(invert.$(image));
        expect(ImageInternals.hasCanvas(image)).toBeFalsy();
        expect(ImageInternals.hasTexture(image)).toBeTruthy();

        // Backup the WebGL texture to a canvas
        await image.backupAsync();
        expect(ImageInternals.hasCanvas(image)).toBeTruthy();
        expect(ImageInternals.hasTexture(image)).toBeTruthy();
      });
    });

    it('Backs up automatically with imageOptions.autoBackup', async () => {
      await usingAsync(factory(), async fim => {
        const invert = new FimOpInvert(fim);

        // Load an image and enable auto-backup
        const image = await fim.createImageFromPngAsync(TestImages.fourSquaresPng(), { autoBackup: true });
        expect(ImageInternals.hasCanvas(image)).toBeTruthy();
        expect(ImageInternals.hasTexture(image)).toBeFalsy();

        // Run an invert operation to make the current copy a WebGL texture. The texture is automatically backed up.
        await image.executeAsync(invert.$(image));
        expect(ImageInternals.hasCanvas(image)).toBeTruthy();
        expect(ImageInternals.hasTexture(image)).toBeTruthy();
      });
    });

  });
}
