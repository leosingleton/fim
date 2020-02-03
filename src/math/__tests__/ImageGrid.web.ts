// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageGrid } from '../ImageGrid';
import { FimWeb } from '../../Fim';
import { FimColor } from '../../primitives/FimColor';
import { DisposableSet } from '@leosingleton/commonlibs';

describe('ImageGrid', () => {

  it('Ensures output covers the full image', () => {
    DisposableSet.using(disposable => {
      const fim = disposable.addDisposable(new FimWeb());
      const output = disposable.addDisposable(fim.createRgbaBuffer(576, 384, '#000'));
      const redTile = disposable.addDisposable(fim.createRgbaBuffer(128, 128, '#f00'));

      const grid = new ImageGrid(output.w, output.h, redTile.w, redTile.h, 12);
      for (const tile of grid.tiles) {
        output.copyFrom(redTile, tile.outputTile, tile.outputFull);
      }

      const red = FimColor.fromString('#f00');
      for (let x = 0; x < output.w; x += 5) {
        for (let y = 0; y < output.h; y += 5) {
          expect(output.getPixel(x, y)).toEqual(red);
        }
      }
    });
  });

});
