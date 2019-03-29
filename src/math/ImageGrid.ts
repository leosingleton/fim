// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimRect, IFimDimensions } from '../primitives';

/**
 * Performs calculations for splitting a large image into a grid of smaller tiles. Used to improve the overall
 * responsiveness of an app by processing an individual tile at a time.
 */
export class ImageGrid implements IFimDimensions {
  /**
   * Constructs an ImageGrid given the input dimensions and desired parameters.
   * @param width Width of the original, full-sized image, in pixels
   * @param height Height of the original, full-sized image, in pixels
   * @param tileWidth Width of each tile, in pixels
   * @param tileHeight Height of each tile, in pixels
   * @param overlap Number of pixels of overlap each tile should have with its neighbor. This is necessary for effects
   *    like blurs, which depend on the input values of adjacent pixels. This value must be an even integer.
   * @param maxHorizontalTiles Maximum number of tiles in the horizontal direction. Zero is used to indicate no limit.
   *    The image is centered and cropped to ensure we do not exceed the maximum number of tiles.
   * @param maxVerticalTiles Maximum number of tiles in the vertical direction. Zero is used to indicate no limit.
   *    The image is centered and cropped to ensure we do not exceed the maximum number of tiles.
   */
  public constructor(width: number, height: number, tileWidth: number, tileHeight: number, overlap = 0,
      maxHorizontalTiles = 0, maxVerticalTiles = 0) {
    // Validate input
    if (overlap % 2 !== 0) {
      throw new Error('overlap not even');
    }

    // Initialize the IFimDimensions variables
    this.w = width;
    this.h = height;
    this.dimensions = FimRect.fromXYWidthHeight(0, 0, width, height);

    // First, calculate the number of tiles to use in each direction
    function getTileCount(srcSize: number, tileSize: number, max: number): number {
      // If we didn't support overlap, this would simply be solving for n:
      //                           tileSize * n >= srcSize
      //
      // However, when adjacent tiles overlap, we subtract the lost pixels:
      //       tileSize * n - overlap * (n - 1) >= srcSize
      //
      // Algebraically, this becomes:
      //   tileSize * n - overlap * n + overlap >= srcSize
      //             tileSize * n - overlap * n >= srcSize - overlap
      //               n * (tileSize - overlap) >= srcSize - overlap
      //
      //                                             srcSize - overlap
      //                                      n >= --------------------
      //                                            tileSize - overlap
      let n = (srcSize - overlap) / (tileSize - overlap);
      n = Math.ceil(n);
      if (max > 0) {
        n = Math.min(n, max);
      }
      return n;
    }
    let tilesH = getTileCount(width, tileWidth, maxHorizontalTiles);
    let tilesV = getTileCount(height, tileHeight, maxVerticalTiles);

    // Next, calculate the size of the image represented by the tiles
    function getTotalTileSize(tileSize: number, tileCount: number): number {
      return (tileSize * tileCount) - (overlap * (tileCount - 1));
    }
    let totalTileWidth = getTotalTileSize(tileWidth, tilesH);
    let totalTileHeight = getTotalTileSize(tileHeight, tilesV);

    // Then, calculate the starting x/y offset for the top-left tile
    let offsetX = (width - totalTileWidth) / 2;
    let offsetY = (height - totalTileHeight) / 2;

    // Finally, calculate the individual tiles
    let halfOverlap = overlap / 2; // integer, because overlapPixels must be even
    function getTile(srcX: number, srcY: number, isLeft: boolean, isTop: boolean, isRight: boolean, isBottom: boolean):
        ImageGridTile {
      // Calculate the input coordinates
      let inputFullX = srcX;
      let inputFullY = srcY;
      let inputTileX = 0;
      let inputTileY = 0;
      let inputWidth = tileWidth;
      let inputHeight = tileHeight;
      if (inputFullX < 0) {
        inputWidth += inputFullX;
        inputTileX -= inputFullX;
        inputFullX = 0;
      }
      if (inputFullY < 0) {
        inputHeight += inputFullY;
        inputTileY -= inputFullY;
        inputFullY = 0;
      }
      let tooWide = inputFullX + inputWidth - width;
      if (tooWide > 0) {
        inputWidth -= tooWide;
      }
      let tooTall = inputFullY + inputHeight - height;
      if (tooTall > 0) {
        inputHeight -= tooTall;
      }

      // Calculate the output coordinates
      let outputTileX = inputTileX;
      let outputTileY = inputTileY;
      let outputFullX = inputFullX;
      let outputFullY = inputFullY;
      let outputWidth = inputWidth;
      let outputHeight = inputHeight;
      if (!isLeft) {
        outputTileX += halfOverlap;
        outputFullX += halfOverlap;
        outputWidth -= halfOverlap;
      }
      if (!isTop) {
        outputTileY += halfOverlap;
        outputFullY += halfOverlap;
        outputHeight -= halfOverlap;
      }
      if (!isRight) {
        outputWidth -= halfOverlap;
      }
      if (!isBottom) {
        outputHeight -= halfOverlap;
      }

      return new ImageGridTile(
        FimRect.fromXYWidthHeight(inputFullX, inputFullY, inputWidth, inputHeight),
        FimRect.fromXYWidthHeight(inputTileX, inputTileY, inputWidth, inputHeight),
        FimRect.fromXYWidthHeight(outputTileX, outputTileY, outputWidth, outputHeight),
        FimRect.fromXYWidthHeight(outputFullX, outputFullY, outputWidth, outputHeight));
    }
    let tiles: ImageGridTile[] = [];
    let y = offsetY;
    for (let tileY = 0; tileY < tilesV; tileY++) {
      let x = offsetX;
      for (let tileX = 0; tileX < tilesH; tileX++) {
        tiles.push(getTile(x, y, tileX === 0, tileY === 0, tileX === (tilesH - 1), tileY === (tilesV - 1)));
        x += tileWidth - overlap;
      }
      y += tileHeight - overlap;
    }
    this.tiles = tiles;
  }

  // IFimDimensions implementation
  public readonly w: number;
  public readonly h: number;
  public readonly dimensions: FimRect;

  public readonly tiles: ImageGridTile[];
}

/** Holds the coordinates for a single tile in an ImageGrid */
export class ImageGridTile {
  public constructor(inputFull: FimRect, inputTile: FimRect, outputTile: FimRect, outputFull: FimRect) {
    this.inputFull = inputFull;
    this.inputTile = inputTile;
    this.outputTile = outputTile;
    this.outputFull = outputFull;
  }

  /** When copying input data, the coordinates on the full-sized original image to copy from */
  public readonly inputFull: FimRect;

  /** When copying input data, the coordinates on the tile to copy to */
  public readonly inputTile: FimRect;

  /** When copying output data, the coordinates on the tile to copy from */
  public readonly outputTile: FimRect;

  /** When copying output data, the coordinates on the full-sized destination image to copy to */
  public readonly outputFull: FimRect;

  /*public sourceToTile(point: FimPoint): FimPoint {

  }

  public tileToDest(point: FimPoint): FimPoint {

  }*/
}