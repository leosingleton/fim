// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { CoreBrowserCanvas2D } from '../internal/engine/core/CoreBrowserCanvas2D';
import { CoreBrowserOffscreenCanvas2D } from '../internal/engine/core/CoreBrowserOffscreenCanvas2D';
import { clientAndFactoryBasicSuite, coreCanvas2D } from '@leosingleton/fim-common-tests';

clientAndFactoryBasicSuite('Client and Factory Basic suite for Browsers (no optimizations)',
  (maxImageDimensions) => FimBrowserFactory.create(maxImageDimensions, 'NoOptimizations',
    { disableOptimizations: true }));

clientAndFactoryBasicSuite('Client and Factory Basic suite for Browsers',
  (maxImageDimensions) => FimBrowserFactory.create(maxImageDimensions));

coreCanvas2D('CoreBrowserCanvas2D',
  (dimensions, imageHandle) => new CoreBrowserCanvas2D(dimensions, imageHandle));

coreCanvas2D('CoreBrowserOffscreenCanvas2D',
  (dimensions, imageHandle) => new CoreBrowserOffscreenCanvas2D(dimensions, imageHandle));
