// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { CoreBrowserDomCanvas2D } from '../core/CoreBrowserDomCanvas2D';
import { CoreBrowserDomCanvasWebGL } from '../core/CoreBrowserDomCanvasWebGL';
import { CoreBrowserOffscreenCanvas2D } from '../core/CoreBrowserOffscreenCanvas2D';
import { CoreBrowserOffscreenCanvasWebGL } from '../core/CoreBrowserOffscreenCanvasWebGL';
import { deepCopy } from '@leosingleton/commonlibs';
import { defaultEngineOptions } from '@leosingleton/fim/internals';
import { TestSuites } from '@leosingleton/fim-common-tests';

// Enable these two for more detailed info in the console when running unit tests
const showTracing = false;
const showWarnings = false;

TestSuites.fim('FimBrowserFactory with OffscreenCanvas enabled (debug mode)', () => {
  const fim = FimBrowserFactory.create();
  fim.engineOptions.debugMode = true;
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

TestSuites.fim('FimBrowserFactory with OffscreenCanvas disabled (debug mode)', () => {
  const fim = FimBrowserFactory.create();
  fim.engineOptions.debugMode = true;
  fim.engineOptions.disableOffscreenCanvas = true;
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

TestSuites.fim('FimBrowserFactory with OffscreenCanvas enabled', () => {
  const fim = FimBrowserFactory.create();
  fim.engineOptions.showTracing = showTracing;
  fim.engineOptions.showWarnings = showWarnings;
  return fim;
});

TestSuites.fim('FimBrowserFactory with OffscreenCanvas disabled', () => {
  const fim = FimBrowserFactory.create();
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

TestSuites.coreCanvas2D('CoreBrowserDomCanvas2D',
  (dimensions, canvasOptions) => new CoreBrowserDomCanvas2D(dimensions, canvasOptions, 'UnitTest', engineOptions));

TestSuites.coreCanvasWebGL('CoreBrowserDomCanvasWebGL',
  (dimensions, canvasOptions) => new CoreBrowserDomCanvasWebGL(dimensions, canvasOptions, 'UnitTest', engineOptions));

TestSuites.coreCanvas2D('CoreBrowserOffscreenCanvas2D',
  (dimensions, canvasOptions) => new CoreBrowserOffscreenCanvas2D(dimensions, canvasOptions, 'UnitTest',
    engineOptions));

TestSuites.coreCanvasWebGL('CoreBrowserOffscreenCanvasWebGL',
  (dimensions, canvasOptions) => new CoreBrowserOffscreenCanvasWebGL(dimensions, canvasOptions, 'UnitTest',
    engineOptions));
