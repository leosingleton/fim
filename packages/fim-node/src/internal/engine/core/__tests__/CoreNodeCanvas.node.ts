// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreNodeCanvas } from '../CoreNodeCanvas';
import { FimDimensions } from '@leosingleton/fim';

describe('CoreNodeCanvas', () => {

  it('Creates and disposes', () => {
    const canvas = new CoreNodeCanvas(FimDimensions.fromWidthHeight(100, 100), 'CoreNodeCanvas - Creates and disposes');
    canvas.dispose();
  });

});
