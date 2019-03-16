import { FimRect } from '../FimRect';
import { FimPoint } from '../FimPoint';

function validate1234(rect: FimRect): void {
  expect(rect.xLeft).toEqual(100);
  expect(rect.yTop).toEqual(200);
  expect(rect.w).toEqual(300);
  expect(rect.h).toEqual(400);
  expect(rect.xRight).toEqual(400);
  expect(rect.yBottom).toEqual(600);
}

describe('FimRect', () => {

  it('Constructs from x/y/width/height', () => {
    validate1234(FimRect.fromXYWidthHeight(100, 200, 300, 400));
  });

  it('Constructs from point/width/height', () => {
    validate1234(FimRect.fromPointWidthHeight(new FimPoint(100, 200), 300, 400));
  });

  it('Constructs from coordinates', () => {
    validate1234(FimRect.fromCoordinates(100, 200, 400, 600));
  });

  it('Constructs from points', () => {
    validate1234(FimRect.fromPoints(new FimPoint(100, 200), new FimPoint(400, 600)));
  });

  it('equals', () => {
    let rect1 = FimRect.fromXYWidthHeight(100, 200, 300, 400);
    let rect2 = FimRect.fromXYWidthHeight(100, 200, 300, 400);
    let rect3 = FimRect.fromXYWidthHeight(100, 200, 400, 300);
    expect(rect1.equals(rect2)).toBeTruthy();
    expect(rect2.equals(rect1)).toBeTruthy();
    expect(rect1.equals(rect3)).toBeFalsy();
    expect(rect3.equals(rect2)).toBeFalsy();
  });

  it('Compares sameDimensions', () => {
    let rect1 = FimRect.fromXYWidthHeight(100, 200, 300, 400);
    let rect2 = FimRect.fromXYWidthHeight(200, 300, 300, 400);
    let rect3 = FimRect.fromXYWidthHeight(100, 200, 400, 300);
    expect(rect1.sameDimensions(rect2)).toBeTruthy();
    expect(rect2.sameDimensions(rect1)).toBeTruthy();
    expect(rect1.sameDimensions(rect3)).toBeFalsy();
    expect(rect3.sameDimensions(rect2)).toBeFalsy();
  });

  it('Converts upright', () => {
    let rect = FimRect.fromPoints(new FimPoint(400, 600), new FimPoint(100, 200));
    validate1234(rect.toUpright());
  });

});
