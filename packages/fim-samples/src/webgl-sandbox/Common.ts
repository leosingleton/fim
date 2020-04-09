// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Stopwatch } from '@leosingleton/commonlibs';
import { FimBrowserFactory } from '@leosingleton/fim-browser';
import $ from 'jquery';
import { OpSelectChannel } from './OpSelectChannel';

/** Global FIM library instance */
export const fim = FimBrowserFactory.create();

/** Global instance of the OpSelectChannel shader */
export const opSelectChannel = new OpSelectChannel(fim);

/** Performance testing results */
export interface IPerformanceResults {
  /** Average execution time, in milliseconds */
  avg: number;

  /** Average execution time, in frames per second */
  fps: number;

  /** Number of iterations executed */
  iterations: number;

  /** Description of the test case and results */
  message: string;
}

class PerformanceTester {
  public description: string;
  public test: () => void;
  public testAsync: () => Promise<void>;
  public blockCount: number;
  public timePerBlock: number;
  public discardPercentage: number;

  public run(): IPerformanceResults {
    this.init();
    do {
      this.test();
    } while (this.shouldContinue());
    return this.result();
  }

  public async runAsync(): Promise<IPerformanceResults> {
    this.init();
    do {
      await this.testAsync();
    } while (this.shouldContinue());
    return this.result();
  }

  private totalIterations: number;
  private values: number[];
  private iterationsSinceLastBlock: number;
  private lastBlockEndTimestamp: number;
  private timer: Stopwatch;

  private init(): void {
    this.totalIterations = 0;
    this.values = [];
    this.iterationsSinceLastBlock = 0;
    this.lastBlockEndTimestamp = 0;
    this.timer = Stopwatch.startNew();
  }

  private shouldContinue(): boolean {
    // Execute until we reach a specific minimum time per block
    ++this.totalIterations;
    const iterations = ++this.iterationsSinceLastBlock;
    const time = this.timer.getElapsedMilliseconds();
    const elapsed = time - this.lastBlockEndTimestamp;
    const timePerBlock = this.timePerBlock;
    if (elapsed < timePerBlock) {
      return true;
    }

    // Record the block. Adjust the iterations for any time over the expected, but only allow
    const adjustedIterations = iterations * timePerBlock / elapsed;
    const avgTimePerIteration = timePerBlock / Math.max(adjustedIterations, iterations - 1);
    const values = this.values;
    values.push(avgTimePerIteration);
    this.iterationsSinceLastBlock = 0;
    this.lastBlockEndTimestamp = time;

    // Continue until we have reached the desired number of blocks
    return (values.length < this.blockCount);
  }

  private result(): IPerformanceResults {
    // Sort the blocks by execution time
    let values = this.values;
    const originalCount = this.totalIterations;
    values.sort();

    // Calculate the number of blocks to keep. Keep the ones in the middle.
    const keep = Math.ceil(values.length * (1 - this.discardPercentage));
    const skip = Math.floor(keep / 2);
    values = values.slice(skip, skip + keep);

    // Calculate the average iteration time of the remaining blocks
    let sum = 0;
    for (const value of values) {
      sum += value;
    }
    const avg = sum / keep;

    // Format output string
    const fps = 1000 / avg;
    const msg = `${this.description}\nAverage: ${avg.toFixed(2)} ms (${fps.toFixed(2)} FPS)\n` +
      `Iterations: ${originalCount}`;

    return {
      iterations: originalCount,
      avg,
      fps,
      message: msg
    };
  }
}

/**
 * Measures the performance of an operation
 * @param description Description of the operation
 * @param test Lambda function to test
 * @param blockCount Number of execution blocks to measure. We repeat the test this number of times to discard the
 *    highest and lowest values.
 * @param timePerBlock Time, in milliseconds, that a block should last. On the first run, we measure the number of
 *    iterations it takes to reach this time and repeat that number of iterations. This value should be at least 10 ms
 *    or greater, as the timers in web browsers are only accurate to 1 ms or so.
 * @param discardPercentage Percentage of iteration blocks to discard (0.0 to 1.0). We drop the highest and lowest and
 *    return the average of the remaining blocks.
 * @returns Performance results
 */
export function perfTest(description: string, test: () => void, blockCount = 10, timePerBlock = 50,
    discardPercentage = 0.5): IPerformanceResults {
  const p = new PerformanceTester();
  p.description = description;
  p.test = test;
  p.blockCount = blockCount;
  p.timePerBlock = timePerBlock;
  p.discardPercentage = discardPercentage;
  return p.run();
}

/**
 * Measures the performance of an async operation
 * @param description Description of the operation
 * @param test Async lambda function to test
 * @param blockCount Number of execution blocks to measure. We repeat the test this number of times to discard the
 *    highest and lowest values.
 * @param timePerBlock Time, in milliseconds, that a block should last. On the first run, we measure the number of
 *    iterations it takes to reach this time and repeat that number of iterations. This value should be at least 10 ms
 *    or greater, as the timers in web browsers are only accurate to 1 ms or so.
 * @param discardPercentage Percentage of iteration blocks to discard (0.0 to 1.0). We drop the highest and lowest and
 *    return the average of the remaining blocks.
 * @returns Performance results
 */
export function perfTestAsync(description: string, test: () => Promise<void>, blockCount = 10, timePerBlock = 50,
    discardPercentage = 0.5): Promise<IPerformanceResults> {
  const p = new PerformanceTester();
  p.description = description;
  p.testAsync = test;
  p.blockCount = blockCount;
  p.timePerBlock = timePerBlock;
  p.discardPercentage = discardPercentage;
  return p.runAsync();
}

/** Hash table of performance results */
export interface PerformanceResultsSet {[id: string]: IPerformanceResults}

const performanceValues: PerformanceResultsSet = {};

/**
 * Writes the performance results to the page
 * @param id ID of the <div> or <td> element to set its contents
 * @param results Performance results
 * @param updateTotals Optional function to call to update additional summary data on the page. This function is
 *    provided a hash table of all performance results so far as input
 */
export function recordPerformanceValue(id: string, results: IPerformanceResults,
    updateTotals?: (all: PerformanceResultsSet) => void): void {
  // Add the results to the hash table
  performanceValues[id] = results;

  // Update the element
  const element = $(`.${id}`);
  if (element) {
    element.text(results.avg.toFixed(2));
  }

  // Update summary data
  if (updateTotals) {
    updateTotals(performanceValues);
  }
}
