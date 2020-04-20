// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { FimError } from '../primitives/FimError';
import { Task } from '@leosingleton/commonlibs';

/**
 * Holds the `EngineFim` logic for simulating context loss. Instances of this class have a 1:1 mapping to `EngineFim`
 * instances.
 */
export class ContextLostSim {
  /**
   * Because FIM uses WebGL to perform image processing, WebGL resources may be lost at any time because GPU resources
   * are finite and shared between all applications on the client computer. This function simulates this occurrence to
   * ensure the client application handles it correctly.
   * @param lossInterval Interval between context lost events, in milliseconds. Default = 10 seconds.
   * @param restoreTime Amount of time after a context loss to simulate a context restored event, in milliseconds.
   *    Default = 0.
   */
  public enableContextLossSimulation(lossInterval = 10000, restoreTime = 0): void {
    const me = this;

    // Validate and store the parameters
    if (lossInterval < 0) {
      FimError.throwOnInvalidParameter(lossInterval);
    }
    if (restoreTime < 0) {
      FimError.throwOnInvalidParameter(restoreTime);
    }
    me.simulationParameters = { lossInterval, restoreTime };

    // Start the simulation, if needed
    if (!me.isSimulationRunning) {
      me.isSimulationRunning = true;
      Task.runAsyncVoid(() => me.simulationWorkerAsync());
    }
  }

  /** Disables any context loss simulation enabled with `enableContextLossSimulation()` */
  public disableContextLossSimulation(): void {
    this.simulationParameters = undefined;
  }

  /**
   * Called by `EngineFim` whenever any new WebGL canvas is created
   * @param glCanvas Newly-created WebGL canvas
   */
  public onCanvasWebGLCreated(glCanvas: CoreCanvasWebGL): void {
    this.glCanvas = glCanvas;
  }

  /**
   * Called by `EngineFim` immediately before any new WebGL canvas is disposed
   * @param glCanvas WebGL canvas being disposed
   */
  public onCanvasWebGLDisposed(glCanvas: CoreCanvasWebGL): void {
    if (this.glCanvas !== glCanvas) {
      // We should never get here. If we do, somehow the glCanvas member variable got out-of-sync with the corresponding
      // variable in the EngineFim instance.
      FimError.throwOnUnreachableCode();
    }
    this.glCanvas = undefined;
  }

  /** Worker thread that implements the context loss simulation */
  private async simulationWorkerAsync(): Promise<void> {
    const me = this;

    while (me.simulationParameters) {
      // Sleep for the loss interval
      const glCanvas = me.glCanvas;
      await Task.delayAsync(me.simulationParameters.lossInterval);

      if (!me.simulationParameters || glCanvas !== me.glCanvas) {
        // The simulation was disabled or the WebGL canvas changed
        continue;
      }

      // Simulate a context loss
      await glCanvas.loseContextAsync();

      // Sleep for the restore interval
      await Task.delayAsync(me.simulationParameters.restoreTime);

      if (glCanvas !== me.glCanvas) {
        // The WebGL canvas changed
        continue;
      }

      // Simulate the context restored
      await glCanvas.restoreContextAsync();
    }

    me.isSimulationRunning = false;
  }

  /** Current WebGL canvas */
  private glCanvas: CoreCanvasWebGL;

  /** Parameters from `enableContextLossSimulation()`. Set to `undefined` by `disableContextLossSimulation()`. */
  private simulationParameters: {
    /** Interval between context lost events, in milliseconds */
    lossInterval: number,

    /** Amount of time after a context loss to simulate a context restored event, in milliseconds */
    restoreTime: number
  };

  /** Set to `true` whenever the `simulationWorkerAsync()` thread is running */
  private isSimulationRunning = false;
}
