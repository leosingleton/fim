// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeFactory } from '../factory/FimNodeFactory';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { clientAndFactoryBasicSuite, coreCanvas2D, coreCanvasWebGL } from '@leosingleton/fim-common-tests';

clientAndFactoryBasicSuite('Client and Factory Basic suite for Node',
  (maxImageDimensions) => FimNodeFactory.create(maxImageDimensions));

coreCanvas2D('CoreNodeCanvas2D', (dimensions, imageHandle) => new CoreNodeCanvas2D(dimensions, imageHandle));

coreCanvasWebGL('CoreNodeCanvasWebGL', (dimensions, imageHandle) => new CoreNodeCanvasWebGL(dimensions, imageHandle));
