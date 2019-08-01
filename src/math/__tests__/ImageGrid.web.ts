// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageGrid } from '../ImageGrid';
import { FimRgbaBuffer } from '../../image';
import { FimColor } from '../../primitives';
import { DisposableSet } from '@leosingleton/commonlibs';

describe('ImageGrid', () => {

  it('Ensures output covers the full image', () => {
    DisposableSet.using(disposable => {
      let output = disposable.addDisposable(new FimRgbaBuffer(576, 384, '#000'));
      let redTile = disposable.addDisposable(new FimRgbaBuffer(128, 128, '#f00'));

      let grid = new ImageGrid(output.w, output.h, redTile.w, redTile.h, 12);
      grid.tiles.forEach(tile => {
        output.copyFrom(redTile, tile.outputTile, tile.outputFull);
      });

      let red = FimColor.fromString('#f00');
      for (let x = 0; x < output.w; x += 5) {
        for (let y = 0; y < output.h; y += 5) {
          expect(output.getPixel(x, y)).toEqual(red);
        }
      }
    });
  });

});
