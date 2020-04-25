// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ModuleBase, ModuleCoreObject, ModuleCreateDispose, ModuleImageFormat, ModuleImageOperation,
  ModuleOperationType } from './ModuleBase';
import { EngineImage } from '../EngineImage';
import { EngineObject } from '../EngineObject';
import { EngineShader } from '../EngineShader';

/**
 * To optimize logging, all of the logging functions accept either a string or a lambda function that returns the string
 * to log. By using the lamba option, the caller can avoid generating the string if the desired logging level is
 * disabled.
 */
export type MessageOrLambda = string | (() => string);

/** FIM engine module to implement logging */
export class ModuleLogging extends ModuleBase {
  public onEngineObjectCreateDispose(object: EngineObject, operation: ModuleCreateDispose): void {
    this.writeTrace(object, operation);
  }

  public onCoreObjectCreateDispose(_parent: EngineObject, _object: ModuleCoreObject,
      _operation: ModuleCreateDispose): void {
    // Do nothing. We'll let the resource tracking module log this event as it calculates much more useful information
  }

  public onImageOperation(image: EngineImage, format: ModuleImageFormat, type: ModuleOperationType,
      operation: ModuleImageOperation): void {
    this.writeTrace(image, () => `${operation} ${format} ${type}`);
  }

  public onShaderExecution(shader: EngineShader, executionTime: number, megaPixels: number): void {
    this.writeTrace(shader, () => `Execute ${megaPixels.toFixed(1)} MP in ${executionTime.toFixed(1)} ms`);
  }

  /**
   * Writes a trace message to the console. This function is a no-op if tracing is disabled in the engine options.
   * @param object Object handle to log for the message
   * @param message Message to log
   */
  public writeTrace(object: EngineObject, message: MessageOrLambda): void {
    this.writeMessageInternal(object, message, this.fim.engineOptions.showTracing);
  }

  /**
   * Writes a warning message to the console. This function is a no-op if warnings and tracing are disabled in the
   * engine options.
   * @param object Object handle to log for the message
   * @param message Message to log
   */
  public writeWarning(object: EngineObject, message: MessageOrLambda): void {
    this.writeMessageInternal(object, () => `<WARNING> ${ModuleLogging.evalMessageLambda(message)}`,
      this.fim.engineOptions.showTracing || this.fim.engineOptions.showWarnings);
  }

  /**
   * Internal function to writes a message to the console
   * @param object Object handle to log for the message
   * @param message Message to log
   * @param show Only writes if `show` is `true`. Otherwise this function is a no-op.
   */
  private writeMessageInternal(object: EngineObject, message: MessageOrLambda, show: boolean): void {
    if (show) {
      console.log(`${object.objectHandle}: ${ModuleLogging.evalMessageLambda(message)}`);
    }
  }

  /** Converts a `MessageOrLambda` value to a string */
  private static evalMessageLambda(message: MessageOrLambda): string {
    return (typeof message === 'function') ? message() : message;
  }
}
