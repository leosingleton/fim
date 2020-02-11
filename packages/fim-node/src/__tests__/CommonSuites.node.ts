// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeFactory } from '../factory/FimNodeFactory';
import { clientAndFactoryBasicSuite } from '@leosingleton/fim-common-tests';

clientAndFactoryBasicSuite('Client and Factory Basic suite for Node',
  (maxImageDimensions) => FimNodeFactory.create(maxImageDimensions));

clientAndFactoryBasicSuite('Client and Factory Basic suite for Node (no optimizations)',
  (maxImageDimensions) => FimNodeFactory.create(maxImageDimensions, 'NoOptimizations', { disableOptimizations: true }));
