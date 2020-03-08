// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { CoreBrowserCanvasWebGL } from '../core/CoreBrowserCanvasWebGL';
import { CoreBrowserOffscreenCanvas2D } from '../core/CoreBrowserOffscreenCanvas2D';
import { CoreBrowserOffscreenCanvasWebGL } from '../core/CoreBrowserOffscreenCanvasWebGL';
import { deepCopy } from '@leosingleton/commonlibs';
import { defaultEngineOptions } from '@leosingleton/fim/internals';
import { TestSuites } from '@leosingleton/fim-common-tests';

// Enable these two for more detailed info in the console when running unit tests
const showTracing = true;
const showWarnings = true;

TestSuites.fim('FimBrowserFactory with OffscreenCanvas enabled (debug mode)', (maxImageDimensions) => {
  const fim = FimBrowserFactory.create(maxImageDimensions);
  fim.engineOptions.debugMode = true;
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

TestSuites.fim('FimBrowserFactory with OffscreenCanvas disabled (debug mode)', (maxImageDimensions) => {
  const fim = FimBrowserFactory.create(maxImageDimensions);
  fim.engineOptions.debugMode = true;
  fim.engineOptions.disableOffscreenCanvas = true;
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

TestSuites.fim('FimBrowserFactory with OffscreenCanvas enabled', (maxImageDimensions) => {
  const fim = FimBrowserFactory.create(maxImageDimensions);
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

TestSuites.fim('FimBrowserFactory with OffscreenCanvas disabled', (maxImageDimensions) => {
  const fim = FimBrowserFactory.create(maxImageDimensions);
  fim.engineOptions.disableOffscreenCanvas = true;
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

// Always enable debugMode on unit tests to help catch bugs
const engineOptions = deepCopy(defaultEngineOptions);
engineOptions.debugMode = true;
engineOptions.showTracing = showTracing;
engineOptions.showWarnings = showWarnings;

TestSuites.coreCanvas2D('CoreBrowserCanvas2D',
  (dimensions) => new CoreBrowserCanvas2D(dimensions, 'UnitTest', engineOptions));

TestSuites.coreCanvasWebGL('CoreBrowserCanvasWebGL',
  (dimensions) => new CoreBrowserCanvasWebGL(dimensions, 'UnitTest', engineOptions));

TestSuites.coreCanvas2D('CoreBrowserOffscreenCanvas2D',
  (dimensions) => new CoreBrowserOffscreenCanvas2D(dimensions, 'UnitTest', engineOptions));

TestSuites.coreCanvasWebGL('CoreBrowserOffscreenCanvasWebGL',
  (dimensions) => new CoreBrowserOffscreenCanvasWebGL(dimensions, 'UnitTest', engineOptions));
