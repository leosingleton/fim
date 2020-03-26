// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor } from '../FimColor';

describe('FimColor', () => {

  it('Constructs from RGBA bytes', () => {
    const color = FimColor.fromRGBABytes(127, 255, 63, 127);
    expect(color.r).toEqual(127);
    expect(color.g).toEqual(255);
    expect(color.b).toEqual(63);
    expect(color.a).toEqual(127);
    expect(color.string).toEqual('#7fff3f7f');
  });

  it('Constructs from RGBA floats', () => {
    const color = FimColor.fromRGBAFloats(0.5, 1, 0.25, 0.5);
    expect(color.r).toEqual(128);
    expect(color.g).toEqual(255);
    expect(color.b).toEqual(64);
    expect(color.a).toEqual(128);
    expect(color.string).toEqual('#80ff4080');
  });

  it('Constructs from strings', () => {
    const color1 = FimColor.fromString('#abc');
    expect(color1.string).toEqual('#aabbcc');

    const color2 = FimColor.fromString('#abcd');
    expect(color2.string).toEqual('#aabbccdd');

    const color3 = FimColor.fromString('#a1b2c3');
    expect(color3.string).toEqual('#a1b2c3');

    const color4 = FimColor.fromString('#a1b2c3d4');
    expect(color4.string).toEqual('#a1b2c3d4');
  });

  it('Compares colors', () => {
    const color1 = FimColor.fromString('#fff');
    const color2 = FimColor.fromString('#ffffffff');
    const color3 = FimColor.fromString('#999');
    expect(color1.equals(color2)).toBeTruthy();
    expect(color1.equals('#ffff')).toBeTruthy();
    expect(color2.equals(color1)).toBeTruthy();
    expect(color1.equals(color3)).toBeFalsy();
    expect(color2.equals(color3)).toBeFalsy();
  });

  it('Calculates luminance', () => {
    const black = FimColor.fromString('#000');
    const white = FimColor.fromString('#fff');

    expect(black.getLuminance()).toEqual(0);
    expect(white.getLuminance()).toEqual(1);
  });

  it('Converts to vectors', () => {
    const red = FimColor.fromString('#f00');
    expect(red.toVector()).toEqual([1, 0, 0, 1]);
  });

  it('Computes distance', () => {
    const black = FimColor.fromString('#000');
    const white = FimColor.fromString('#fff');
    expect(black.distance(white)).toEqual(1);
    expect(black.distance(black)).toEqual(0);
    expect(white.distance(white)).toEqual(0);
  });

});
