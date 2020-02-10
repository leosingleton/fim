// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Dispatcher } from '../Dispatcher';
import { DispatcherClient } from '../DispatcherClient';
import { DispatcherCommand } from '../DispatcherCommand';
import { DispatcherResult } from '../DispatcherResult';

class MockDispatcher implements Dispatcher {
  public dispatchCommand(command: DispatcherCommand): void {
    this.commandsReceived++;

    this.onCommandResult({
      sequenceNumber: command.sequenceNumber,
      opcode: command.opcode,
      commandResult: command
    });
  }

  public onCommandResult: (result: DispatcherResult) => void;

  public commandsReceived = 0;
}

describe('DispatcherClient', () => {

  it('Dispatches commands', () => {
    const mock = new MockDispatcher();
    const client = new DispatcherClient(mock);

    client.dispatchCommand('MyHandle', {
      opcode: 'TestCommand',
      optimizationHints: {
        canQueue: false
      }
    });

    expect(mock.commandsReceived).toEqual(1);
  });

  it('Dispatches commands and waits', async () => {
    const mock = new MockDispatcher();
    const client = new DispatcherClient(mock);

    const result = await client.dispatchCommandAndWaitAsync('MyHandle', {
      opcode: 'TestCommand',
      optimizationHints: {
        canQueue: false
      }
    }) as DispatcherCommand;

    expect(result.opcode).toEqual('TestCommand');
  });

});
