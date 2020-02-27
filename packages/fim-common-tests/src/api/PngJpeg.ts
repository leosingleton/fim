// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { red, small } from '../common/Globals';
import { Fim, FimDimensions, FimImage, FimShader } from '@leosingleton/fim';

/** Fim test cases around PNG and JPEG encoding/decoding */
export function fimTestSuitePngJpeg(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim<FimImage, FimShader>
): void {
  describe(description, () => {

    it('Exports to PNG', async () => {
      const client = factory(small);
      const image = client.createImage();
      image.fillSolid(red);
      const png = await image.exportToPngAsync();

      // PNG magic number is 89 50 4E 47 (ASCII for .PNG)
      expect(png[0]).toBe(0x89);
      expect(png[1]).toBe(0x50);
      expect(png[2]).toBe(0x4e);
      expect(png[3]).toBe(0x47);

      client.dispose();
    });

    it('Exports to JPEG', async () => {
      const client = factory(small);
      const image = client.createImage();
      image.fillSolid(red);
      const jpeg = await image.exportToJpegAsync();

      // JPEG magic number is FF D8 FF
      expect(jpeg[0]).toBe(0xff);
      expect(jpeg[1]).toBe(0xd8);
      expect(jpeg[2]).toBe(0xff);

      client.dispose();
    });

  });
}
