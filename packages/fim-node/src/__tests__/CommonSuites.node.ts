// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeFactory } from '../factory/FimNodeFactory';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { deepCopy } from '@leosingleton/commonlibs';
import { defaultEngineOptions } from '@leosingleton/fim/internals';
import { TestSuites } from '@leosingleton/fim-common-tests';

// Enable these two for more detailed info in the console when running unit tests
const showTracing = false;
const showWarnings = false;

TestSuites.fim('FimNodeFactory (debug mode)', (maxImageDimensions) => {
  const fim = FimNodeFactory.create(maxImageDimensions);
  fim.engineOptions.debugMode = true;
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

TestSuites.fim('FimNodeFactory', (maxImageDimensions) => {
  const fim = FimNodeFactory.create(maxImageDimensions);
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

// Always enable debugMode on unit tests to help catch bugs
const engineOptions = deepCopy(defaultEngineOptions);
engineOptions.debugMode = true;
engineOptions.showTracing = showTracing;
engineOptions.showWarnings = showWarnings;

TestSuites.coreCanvas2D('CoreNodeCanvas2D',
  (dimensions, canvasOptions) => new CoreNodeCanvas2D(dimensions, canvasOptions, 'UnitTest', engineOptions));

TestSuites.coreCanvasWebGL('CoreNodeCanvasWebGL',
  (dimensions, canvasOptions) => new CoreNodeCanvasWebGL(dimensions, canvasOptions, 'UnitTest', engineOptions));
