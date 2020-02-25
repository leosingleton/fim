// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { CoreBrowserCanvas2D } from '../core/CoreBrowserCanvas2D';
import { CoreBrowserCanvasWebGL } from '../core/CoreBrowserCanvasWebGL';
import { CoreBrowserOffscreenCanvas2D } from '../core/CoreBrowserOffscreenCanvas2D';
import { CoreBrowserOffscreenCanvasWebGL } from '../core/CoreBrowserOffscreenCanvasWebGL';
import { clientAndFactoryBasicSuite, coreCanvas2D, coreCanvasWebGL } from '@leosingleton/fim-common-tests';

clientAndFactoryBasicSuite('Client and Factory Basic suite for Browsers',
  (maxImageDimensions) => FimBrowserFactory.create(maxImageDimensions));

clientAndFactoryBasicSuite('Client and Factory Basic suite for Browsers with OffscreenCanvas disabled',
    (maxImageDimensions) => {
  const fim = FimBrowserFactory.create(maxImageDimensions);
  fim.engineOptions.disableOffscreenCanvas = true;
  return fim;
});

coreCanvas2D('CoreBrowserCanvas2D',
  (dimensions, imageHandle) => new CoreBrowserCanvas2D(dimensions, imageHandle));

coreCanvasWebGL('CoreBrowserCanvasWebGL',
  (dimensions, imageHandle) => new CoreBrowserCanvasWebGL(dimensions, imageHandle));

coreCanvas2D('CoreBrowserOffscreenCanvas2D',
  (dimensions, imageHandle) => new CoreBrowserOffscreenCanvas2D(dimensions, imageHandle));

coreCanvasWebGL('CoreBrowserOffscreenCanvasWebGL',
  (dimensions, imageHandle) => new CoreBrowserOffscreenCanvasWebGL(dimensions, imageHandle));
