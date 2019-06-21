// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimPoint, FimRect, IFimDimensions } from '../primitives';

/** Flags for the ImageGrid constructor */
export const enum ImageGridFlags {
  /** Default value */
  None = 0,

  /** Centers tiles so that X=0 is the boundary between two tiles on the horizontal axis */  
  ZeroCenterX = (1 << 0),

  /** Centers tiles so that Y=0 is the boundary between two tiles on the vertical axis */
  ZeroCenterY = (1 << 1)
}

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
   * @param flags Optional flags from the ImageGridFlags enum
   */
  public constructor(width: number, height: number, tileWidth: number, tileHeight: number, overlap = 0,
      maxHorizontalTiles = 0, maxVerticalTiles = 0, flags = ImageGridFlags.None) {
    // Ensure overlap is even. If not, round up.
    if (overlap % 2 !== 0) {
      overlap++;
    }

    // Enforce constraints on the max tiles based on the flags to zero center
    if (flags & ImageGridFlags.ZeroCenterX) {
      if (maxHorizontalTiles === 1) {
        throw new Error('maxHorizontalTiles');
      }
      maxHorizontalTiles += maxHorizontalTiles % 2; // Round up to an even number
    }
    if (flags & ImageGridFlags.ZeroCenterY) {
      if (maxVerticalTiles === 1) {
        throw new Error('maxVerticalTiles');
      }
      maxVerticalTiles += maxVerticalTiles % 2; // Round up to an even number
    }

    // Initialize the IFimDimensions variables
    this.w = width;
    this.h = height;
    this.dimensions = FimRect.fromXYWidthHeight(0, 0, width, height);

    // First, calculate the number of tiles to use in each direction
    function getTileCount(srcSize: number, tileSize: number, max: number, zeroCenter: boolean): number {
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
      if (zeroCenter) {
        n += n % 2; // Round up to an even number
      }
      if (max > 0) {
        n = Math.min(n, max);
      }
      return n;
    }
    let tilesH = getTileCount(width, tileWidth, maxHorizontalTiles, (flags & ImageGridFlags.ZeroCenterX) !== 0);
    let tilesV = getTileCount(height, tileHeight, maxVerticalTiles, (flags & ImageGridFlags.ZeroCenterY) !== 0);

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
    function getTile(parent: ImageGrid, srcX: number, srcY: number, isLeft: boolean, isTop: boolean, isRight: boolean,
        isBottom: boolean): ImageGridTile {
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

      return new ImageGridTile(parent, tileWidth, tileHeight,
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
        tiles.push(getTile(this, x, y, tileX === 0, tileY === 0, tileX === (tilesH - 1), tileY === (tilesV - 1)));
        x += tileWidth - overlap;
      }
      y += tileHeight - overlap;
    }
    this.tiles = tiles;
  }

  /**
   * Returns the efficiency of the grid, as a decimal from 0 to 1. The efficiency is defined as the area of the
   * original image divided by the sum of the area of the tiles.
   */
  public getEfficiency(): number {
    let t = this;
    let i = t.tiles;
    return t.dimensions.getArea() / (i.length * i[0].dimensions.getArea());
  }

  // IFimDimensions implementation
  public readonly w: number;
  public readonly h: number;
  public readonly dimensions: FimRect;

  /** Returns the tile coordinates that make up the grid */
  public readonly tiles: ImageGridTile[];
}

/** Holds the coordinates for a single tile in an ImageGrid */
export class ImageGridTile {
  public constructor(parent: ImageGrid, width: number, height: number, inputFull: FimRect, inputTile: FimRect,
      outputTile: FimRect, outputFull: FimRect) {
    // Initialize the IFimDimensions variables
    this.w = width;
    this.h = height;
    this.dimensions = FimRect.fromXYWidthHeight(0, 0, width, height);

    this.parent = parent;
    this.inputFull = inputFull;
    this.inputTile = inputTile;
    this.outputTile = outputTile;
    this.outputFull = outputFull;
  }

  // IFimDimensions implementation
  public readonly w: number;
  public readonly h: number;
  public readonly dimensions: FimRect;
  
  /** Parent ImageGrid to which this tile belongs */
  public readonly parent: ImageGrid;

  /** When copying input data, the coordinates on the full-sized original image to copy from */
  public readonly inputFull: FimRect;

  /** When copying input data, the coordinates on the tile to copy to */
  public readonly inputTile: FimRect;

  /** When copying output data, the coordinates on the tile to copy from */
  public readonly outputTile: FimRect;

  /** When copying output data, the coordinates on the full-sized destination image to copy to */
  public readonly outputFull: FimRect;

  /**
   * Converts a coordinate on the full-size image to a coordinate on this tile.
   * @param point Coordinate on full-size image
   * @param checkBounds By default, the return value could be outside the bounds of the tile. If this value is set to
   *    true, null will be returned instead of an out-of-bounds coordinate.
   * @returns Coordinate on this tile
   */
  public fullToTile(point: FimPoint, checkBounds = false): FimPoint {
    let x = point.x + this.inputTile.xLeft - this.inputFull.xLeft;
    let y = point.y + this.inputTile.yTop - this.inputFull.yTop;

    if (checkBounds) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) {
        return null;
      }
    }

    return new FimPoint(x, y);
  }

  /**
   * Converts a coordinate on this tile to a coordinate on the full-size image.
   * @param point Coordinate on this tile
   * @param checkBounds By default, the return value could be outside the bounds of the full-size image. If this value
   *    is set to true, null will be returned instead of an out-of-bounds coordinate.
   * @returns Coordinate on the full-size image
   */
  public tileToFull(point: FimPoint, checkBounds = false): FimPoint {
    let x = point.x + this.outputFull.xLeft - this.outputTile.xLeft;
    let y = point.y + this.outputFull.yTop - this.outputTile.yTop;

    if (checkBounds) {
      if (x < 0 || y < 0 || x >= this.parent.w || y >= this.parent.h) {
        return null;
      }
    }

    return new FimPoint(x, y);
  }
}
