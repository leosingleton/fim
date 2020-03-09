// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Helper function to write async unit tests that expect to catch an error */
export async function expectErrorAsync<T extends jasmine.Func>(func: Promise<void>):
    Promise<jasmine.FunctionMatchers<T>> {
  return new Promise(resolve => {
    func.then(_value => {
      resolve(expect(undefined));
    }, reason => {
      resolve(expect(reason));
    });
  });
}
