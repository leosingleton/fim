import { FimColor } from '../FimColor';

describe('FimColor', () => {

  it('Constructs from RGBA bytes', () => {
    let color = FimColor.fromRGBABytes(127, 255, 63, 127);
    expect(color.r).toEqual(127);
    expect(color.g).toEqual(255);
    expect(color.b).toEqual(63);
    expect(color.a).toEqual(127);
    expect(color.string).toEqual('#7fff3f7f');
  });

  it('Constructs from RGBA floats', () => {
    let color = FimColor.fromRGBAFloats(0.5, 1, 0.25, 0.5);
    expect(color.r).toEqual(128);
    expect(color.g).toEqual(255);
    expect(color.b).toEqual(64);
    expect(color.a).toEqual(128);
    expect(color.string).toEqual('#80ff4080');
  });

  it('Constructs from strings', () => {
    let color1 = FimColor.fromString('#abc');
    expect(color1.string).toEqual('#aabbcc');

    let color2 = FimColor.fromString('#abcd');
    expect(color2.string).toEqual('#aabbccdd');

    let color3 = FimColor.fromString('#a1b2c3');
    expect(color3.string).toEqual('#a1b2c3');

    let color4 = FimColor.fromString('#a1b2c3d4');
    expect(color4.string).toEqual('#a1b2c3d4');
  });

  it('Compares colors', () => {
    let color1 = FimColor.fromString('#fff');
    let color2 = FimColor.fromString('#ffffffff');
    let color3 = FimColor.fromString('#999');
    expect(color1.equals(color2)).toBeTruthy();
    expect(color2.equals(color1)).toBeTruthy();
    expect(color1.equals(color3)).toBeFalsy();
    expect(color2.equals(color3)).toBeFalsy();
  });

});
