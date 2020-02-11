// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { clientAndFactoryBasicSuite } from '@leosingleton/fim-common-tests';

clientAndFactoryBasicSuite('Client and Factory Basic suite for Browsers',
  (maxImageDimensions) => FimBrowserFactory.create(maxImageDimensions));
