// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimError, FimErrorCode } from './FimError';

/**
 * Class that represents an immutable RGBA color value
 */
export class FimColor {
  private constructor(r: number, g: number, b: number, a: number, string: string) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.string = string;
  }

  /** Red component, expressed as an integer from 0 to 255 */
  public readonly r: number;

  /** Green component, expressed as an integer from 0 to 255 */
  public readonly g: number;

  /** Blue component, expressed as an integer from 0 to 255 */
  public readonly b: number;

  /** Alpha component, expressed as an integer from 0 to 255 */
  public readonly a: number;

  /** Color expressed as a CSS string, e.g. '#fff' */
  public readonly string: string;

  /**
   * Compares two colors for equality
   * @param color Second color to compare
   * @returns True if equal; otherwise false
   */
  public equals(color: FimColor | string): boolean {
    color = FimColor.fromColorOrString(color);
    return (this.r === color.r) && (this.g === color.g) && (this.b === color.b) && (this.a === color.a);
  }

  /**
   * Compares two colors and returns their similarity (ignoring alpha channel)
   * @param color Second color to compare
   * @returns A value ranging from 0.0 (if equal) to 1.0 (if completely different)
   */
  public distance(color: FimColor | string): number {
    color = FimColor.fromColorOrString(color);
    return (Math.abs(this.r - color.r) + Math.abs(this.g - color.g) + Math.abs(this.b - color.b)) / (255 * 3);
  }

  /** Uses the ITU-R BT.709 formula to calculate luminance from RGB */
  public getLuminance(): number {
    const value =
      this.r * 0.2126 + // Red
      this.g * 0.7152 + // Green
      this.b * 0.0722;  // Blue
    return Math.round(value / 255);
  }

  /** Returns the color as an OpenGL-style vector, of size 4, with values from 0.0 to 1.0. */
  public toVector(): number[] {
    return [this.r / 255, this.g / 255, this.b / 255, this.a / 255];
  }

  /**
   * Constructs a FimColor from RGBA byte values, where each component is an integer from 0 to 255
   * @param red Red component
   * @param green Green component
   * @param blue Blue component
   * @param alpha Alpha component
   * @returns FimColor
   */
  public static fromRGBABytes(red: number, green: number, blue: number, alpha = 255): FimColor {
    // Validate the input values are integers from 0 to 255
    function validateInput(value: number): void {
      if (value < 0 || value > 255) {
        throw new FimError(FimErrorCode.InvalidParameter, `Out of range: ${value}`);
      }
      if (value !== Math.floor(value)) {
        throw new FimError(FimErrorCode.InvalidParameter, `Not an int: ${value}`);
      }
    }
    validateInput(red);
    validateInput(green);
    validateInput(blue);
    validateInput(alpha);

    // Construct the string representation
    function toHex(value: number): string {
      return (`0${value.toString(16)}`).substr(-2);
    }
    let string = `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
    if (alpha < 255) {
      string += toHex(alpha);
    }

    return new FimColor(red, green, blue, alpha, string);
  }

  /**
   * Constructs a FimColor from RGBA byte values, where each component is a floating point value from 0 to 1
   * @param red Red component
   * @param green Green component
   * @param blue Blue component
   * @param alpha Alpha component
   * @returns FimColor
   */
  public static fromRGBAFloats(red: number, green: number, blue: number, alpha = 1): FimColor {
    return this.fromRGBABytes(Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255),
      Math.round(alpha * 255));
  }

  /**
   * Constructs a FimColor from a CSS string
   * @param color Color expressed in string format. Valid inputs are "#rgb", "#rgba", "#rrggbb", or "#rrggbbaa".
   */
  public static fromString(color: string): FimColor {
    if (color[0] !== '#') {
      FimError.throwOnInvalidParameter(color);
    }

    /** Parses a 1 character hex number */
    function parse1(offset: number): number {
      const c = color.substr(offset, 1);
      return Number.parseInt(c + c, 16);
    }

    /** Parses a 2 character hex number */
    function parse2(offset: number): number {
      const num = color.substr(offset, 2);
      return Number.parseInt(num, 16);
    }

    switch (color.length) {
      case 4: // "#rgb"
        return this.fromRGBABytes(parse1(1), parse1(2), parse1(3));

      case 5: // "#rgba"
        return this.fromRGBABytes(parse1(1), parse1(2), parse1(3), parse1(4));

      case 7: // "#rrggbb"
        return this.fromRGBABytes(parse2(1), parse2(3), parse2(5));

      case 9: // "#rrggbbaa"
        return this.fromRGBABytes(parse2(1), parse2(3), parse2(5), parse2(7));

      default:
        FimError.throwOnInvalidParameter(color);
    }
  }

  /**
   * Returns a `FimColor` from a parameter that may be either a color or a string
   * @param color `FimColor` or `string`
   */
  public static fromColorOrString(color: FimColor | string): FimColor {
    return (typeof(color) !== 'string') ? color : FimColor.fromString(color);
  }
}
