// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageGrid } from '../ImageGrid';
import { FimRect } from '../../primitives';

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

});
