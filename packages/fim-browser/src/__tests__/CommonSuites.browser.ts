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

TestSuites.fim('FimBrowserFactory with OffscreenCanvas enabled', (maxImageDimensions) => {
  const fim = FimBrowserFactory.create(maxImageDimensions);
  fim.engineOptions.debugMode = true;
  return fim;
});

TestSuites.fim('FimBrowserFactory with OffscreenCanvas disabled', (maxImageDimensions) => {
  const fim = FimBrowserFactory.create(maxImageDimensions);
  fim.engineOptions.debugMode = true;
  fim.engineOptions.disableOffscreenCanvas = true;
  return fim;
});

// Always enable debugMode on unit tests to help catch bugs
const engineOptions = deepCopy(defaultEngineOptions);
engineOptions.debugMode = true;

TestSuites.coreCanvas2D('CoreBrowserCanvas2D',
  (dimensions) => new CoreBrowserCanvas2D(dimensions, 'UnitTest', engineOptions));

TestSuites.coreCanvasWebGL('CoreBrowserCanvasWebGL',
  (dimensions) => new CoreBrowserCanvasWebGL(dimensions, 'UnitTest', engineOptions));

TestSuites.coreCanvas2D('CoreBrowserOffscreenCanvas2D',
  (dimensions) => new CoreBrowserOffscreenCanvas2D(dimensions, 'UnitTest', engineOptions));

TestSuites.coreCanvasWebGL('CoreBrowserOffscreenCanvasWebGL',
  (dimensions) => new CoreBrowserOffscreenCanvasWebGL(dimensions, 'UnitTest', engineOptions));
