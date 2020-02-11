// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { CoreBrowserCanvas } from '../internal/engine/core/CoreBrowserCanvas';
import { CoreBrowserOffscreenCanvas } from '../internal/engine/core/CoreBrowserOffscreenCanvas';
import { clientAndFactoryBasicSuite, coreCanvas2D } from '@leosingleton/fim-common-tests';

clientAndFactoryBasicSuite('Client and Factory Basic suite for Browsers (no optimizations)',
  (maxImageDimensions) => FimBrowserFactory.create(maxImageDimensions, 'NoOptimizations',
    { disableOptimizations: true }));

clientAndFactoryBasicSuite('Client and Factory Basic suite for Browsers',
  (maxImageDimensions) => FimBrowserFactory.create(maxImageDimensions));

coreCanvas2D('CoreBrowserCanvas',
  (dimensions, imageHandle) => new CoreBrowserCanvas(dimensions, imageHandle));

coreCanvas2D('CoreBrowserOffscreenCanvas',
  (dimensions, imageHandle) => new CoreBrowserOffscreenCanvas(dimensions, imageHandle));
