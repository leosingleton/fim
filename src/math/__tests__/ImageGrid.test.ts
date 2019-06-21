// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageGrid, ImageGridFlags } from '../ImageGrid';
import { FimRect, FimPoint, FimColor } from '../../primitives';
import { DisposableSet } from '@leosingleton/commonlibs';
import { FimRgbaBuffer } from '../../image';

describe('ImageGrid', () => {

  it('Calculates basic case', () => {
    // Break a 1000x1000 image into four 500x500
    let grid = new ImageGrid(1000, 1000, 500, 500);

    expect(grid.tiles.length).toEqual(4);

    expect(grid.tiles[0].inputFull).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[1].inputFull).toEqual(FimRect.fromXYWidthHeight(500, 0, 500, 500));
    expect(grid.tiles[2].inputFull).toEqual(FimRect.fromXYWidthHeight(0, 500, 500, 500));
    expect(grid.tiles[3].inputFull).toEqual(FimRect.fromXYWidthHeight(500, 500, 500, 500));

    expect(grid.tiles[0].inputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[1].inputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[2].inputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[3].inputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));

    expect(grid.tiles[0].outputFull).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[1].outputFull).toEqual(FimRect.fromXYWidthHeight(500, 0, 500, 500));
    expect(grid.tiles[2].outputFull).toEqual(FimRect.fromXYWidthHeight(0, 500, 500, 500));
    expect(grid.tiles[3].outputFull).toEqual(FimRect.fromXYWidthHeight(500, 500, 500, 500));

    expect(grid.tiles[0].outputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[1].outputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[2].outputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[3].outputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
  });

  it('Calculates crop', () => {
    // Break a 1000x1000 image into one 500x500
    let grid = new ImageGrid(1000, 1000, 500, 500, 0, 1, 1);

    expect(grid.tiles.length).toEqual(1);

    expect(grid.tiles[0].inputFull).toEqual(FimRect.fromXYWidthHeight(250, 250, 500, 500));
    expect(grid.tiles[0].inputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[0].outputFull).toEqual(FimRect.fromXYWidthHeight(250, 250, 500, 500));
    expect(grid.tiles[0].outputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
  });

  it('Calculates with overlap', () => {
    // Break a 1000x1000 image into four 512x512, with 20 pixel overlap.
    //
    // This will leave 4 (1024 - 1000 - 20) pixels unused in each dimension, or more exactly, a 2 pixel border around
    // the outer edge.
    let grid = new ImageGrid(1000, 1000, 512, 512, 20);

    expect(grid.tiles.length).toEqual(4);

    expect(grid.tiles[0].inputFull).toEqual(FimRect.fromXYWidthHeight(0, 0, 510, 510));
    expect(grid.tiles[1].inputFull).toEqual(FimRect.fromXYWidthHeight(490, 0, 510, 510));
    expect(grid.tiles[2].inputFull).toEqual(FimRect.fromXYWidthHeight(0, 490, 510, 510));
    expect(grid.tiles[3].inputFull).toEqual(FimRect.fromXYWidthHeight(490, 490, 510, 510));

    expect(grid.tiles[0].inputTile).toEqual(FimRect.fromXYWidthHeight(2, 2, 510, 510));
    expect(grid.tiles[1].inputTile).toEqual(FimRect.fromXYWidthHeight(0, 2, 510, 510));
    expect(grid.tiles[2].inputTile).toEqual(FimRect.fromXYWidthHeight(2, 0, 510, 510));
    expect(grid.tiles[3].inputTile).toEqual(FimRect.fromXYWidthHeight(0, 0, 510, 510));

    expect(grid.tiles[0].outputFull).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(grid.tiles[1].outputFull).toEqual(FimRect.fromXYWidthHeight(500, 0, 500, 500));
    expect(grid.tiles[2].outputFull).toEqual(FimRect.fromXYWidthHeight(0, 500, 500, 500));
    expect(grid.tiles[3].outputFull).toEqual(FimRect.fromXYWidthHeight(500, 500, 500, 500));

    expect(grid.tiles[0].outputTile).toEqual(FimRect.fromXYWidthHeight(2, 2, 500, 500));
    expect(grid.tiles[1].outputTile).toEqual(FimRect.fromXYWidthHeight(10, 2, 500, 500));
    expect(grid.tiles[2].outputTile).toEqual(FimRect.fromXYWidthHeight(2, 10, 500, 500));
    expect(grid.tiles[3].outputTile).toEqual(FimRect.fromXYWidthHeight(10, 10, 500, 500));
  });

  it('Calculates efficiency', () => {
    // Break a 1000x1000 image into four 500x500. Efficiency == 100%
    let grid1 = new ImageGrid(1000, 1000, 500, 500);
    expect(grid1.getEfficiency()).toEqual(1);

    // Break a 1024x512 image into two 512x512. Efficiency == 100%
    let grid2 = new ImageGrid(1024, 512, 512, 512);
    expect(grid2.getEfficiency()).toEqual(1);

    // Break a 1024x256 image into two 512x512. Efficiency == 50%
    let grid3 = new ImageGrid(1024, 256, 512, 512);
    expect(grid3.getEfficiency()).toEqual(0.5);
  });

  it('Converts between full-size and tile coordinates without overlap', () => {
    // Break a 1000x1000 image into four 500x500
    let grid = new ImageGrid(1000, 1000, 500, 500);

    // tile0 is the top-left quadrant
    let tile0 = grid.tiles[0];
    expect(tile0.inputFull).toEqual(FimRect.fromXYWidthHeight(0, 0, 500, 500));
    expect(tile0.fullToTile(new FimPoint(100, 100))).toEqual(new FimPoint(100, 100));
    expect(tile0.tileToFull(new FimPoint(100, 100))).toEqual(new FimPoint(100, 100));

    // Try out-of-bounds, with and without bounds checking
    expect(tile0.fullToTile(new FimPoint(100, 600), true)).toBeNull();
    expect(tile0.tileToFull(new FimPoint(100, 600), true)).toEqual(new FimPoint(100, 600)); // Not out-of-bound on dest
    expect(tile0.tileToFull(new FimPoint(100, 1600), true)).toBeNull();
    expect(tile0.fullToTile(new FimPoint(100, 600))).toEqual(new FimPoint(100, 600));
    expect(tile0.tileToFull(new FimPoint(100, 600))).toEqual(new FimPoint(100, 600));

    // tile3 is the bottom-right quadrant
    let tile3 = grid.tiles[3];
    expect(tile3.inputFull).toEqual(FimRect.fromXYWidthHeight(500, 500, 500, 500));
    expect(tile3.fullToTile(new FimPoint(600, 700))).toEqual(new FimPoint(100, 200));
    expect(tile3.tileToFull(new FimPoint(100, 200))).toEqual(new FimPoint(600, 700));

    // Try out-of-bounds, with and without bounds checking
    expect(tile3.fullToTile(new FimPoint(100, 600), true)).toBeNull();
    expect(tile3.tileToFull(new FimPoint(100, -100), true)).toEqual(new FimPoint(600, 400)); // Not out-of-bound on dst
    expect(tile3.tileToFull(new FimPoint(100, -600), true)).toBeNull();
    expect(tile3.fullToTile(new FimPoint(100, 600))).toEqual(new FimPoint(-400, 100));
    expect(tile3.tileToFull(new FimPoint(-400, 100))).toEqual(new FimPoint(100, 600));
  });

  it('Ensures output covers the full image', () => {
    DisposableSet.using(disposable => {
      let output = disposable.addDisposable(new FimRgbaBuffer(576, 384, '#000'));
      let redTile = disposable.addDisposable(new FimRgbaBuffer(128, 128, '#f00'));

      let grid = new ImageGrid(output.w, output.h, redTile.w, redTile.h, 12);
      grid.tiles.forEach(tile => {
        output.copyFromRgbaBuffer(redTile, tile.outputTile, tile.outputFull);
      });

      let red = FimColor.fromString('#f00');
      for (let x = 0; x < output.w; x += 5) {
        for (let y = 0; y < output.h; y += 5) {
          expect(output.getPixel(x, y)).toEqual(red);
        }
      }
    });
  });

  it('Calculates with ZeroCenter flags', () => {
    let grid = new ImageGrid(5313, 2988, 2048, 2048, 0, 0, 0, ImageGridFlags.ZeroCenterX | ImageGridFlags.ZeroCenterY);
    expect(grid.tiles.length).toEqual(8);
  });

});
