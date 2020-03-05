// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeFactory } from '../factory/FimNodeFactory';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { deepCopy } from '@leosingleton/commonlibs';
import { defaultEngineOptions } from '@leosingleton/fim/internals';
import { TestSuites } from '@leosingleton/fim-common-tests';

TestSuites.fim('FimNodeFactory (debug mode)', (maxImageDimensions) => {
  const fim = FimNodeFactory.create(maxImageDimensions);
  fim.engineOptions.debugMode = true;
  return fim;
});

TestSuites.fim('FimNodeFactory', (maxImageDimensions) => {
  return FimNodeFactory.create(maxImageDimensions);
});

// Always enable debugMode on unit tests to help catch bugs
const engineOptions = deepCopy(defaultEngineOptions);
engineOptions.debugMode = true;

TestSuites.coreCanvas2D('CoreNodeCanvas2D',
  (dimensions) => new CoreNodeCanvas2D(dimensions, 'UnitTest', engineOptions));

TestSuites.coreCanvasWebGL('CoreNodeCanvasWebGL',
  (dimensions) => new CoreNodeCanvasWebGL(dimensions, 'UnitTest', engineOptions));
