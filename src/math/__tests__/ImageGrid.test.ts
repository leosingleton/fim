// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageGrid } from '../ImageGrid';
import { FimRect } from '../../primitives';

describe('ImageGrid', () => {

  it('Calculates basic case', () => {
    // Break a 1000x1000 image into two 500x500
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

});