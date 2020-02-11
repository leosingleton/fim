// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeFactory } from '../factory/FimNodeFactory';
import { CoreNodeCanvas } from '../internal/engine/core/CoreNodeCanvas';
import { clientAndFactoryBasicSuite, coreCanvas2D } from '@leosingleton/fim-common-tests';

clientAndFactoryBasicSuite('Client and Factory Basic suite for Node (no optimizations)',
  (maxImageDimensions) => FimNodeFactory.create(maxImageDimensions, 'NoOptimizations', { disableOptimizations: true }));

clientAndFactoryBasicSuite('Client and Factory Basic suite for Node',
  (maxImageDimensions) => FimNodeFactory.create(maxImageDimensions));

coreCanvas2D('CoreNodeCanvas', (dimensions, imageHandle) => new CoreNodeCanvas(dimensions, imageHandle));
