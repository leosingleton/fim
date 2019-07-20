// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, FimCanvasBase, FimGLCanvas, FimGLProgramCopy, FimGLTexture,
  FimRect } from '../../build/dist/index.js';
import { Stopwatch, TaskScheduler, parseQueryString, using } from '@leosingleton/commonlibs';
import $ from 'jquery';

let qs = parseQueryString();

/** Loads a test image and returns the JPEG as a byte array */
export async function loadTestImageToArray(): Promise<Uint8Array> {
  // Load a sample JPEG image into a byte array
  let url = qs['img'] || 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg';
  let fetchResponse = await fetch(url, { method: 'GET' });
  let jpeg = await fetchResponse.arrayBuffer();
  return new Uint8Array(jpeg);
}

/** Loads a test image onto a FimCanvas */
export async function loadTestImage(): Promise<FimCanvas> {
  let jpeg = await loadTestImageToArray();
  return FimCanvas.createFromJpeg(jpeg);
}

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

  private iterationsPerBlock: number;
  private values: number[];
  private iterationsSinceLastBlock: number;
  private lastBlockEndTimestamp: number;
  private timer: Stopwatch;

  private init(): void {
    this.iterationsPerBlock = 0;
    this.values = [];
    this.iterationsSinceLastBlock = 0;
    this.lastBlockEndTimestamp = 0;
    this.timer = Stopwatch.startNew();
  }

  private shouldContinue(): boolean {
    // On the first block, we haven't yet calculated the number of iterations per block. Instead, we keep executing
    // until we reach a specific time.
    let iterations = ++this.iterationsSinceLastBlock;
    if (this.iterationsPerBlock === 0) {
      let time = this.timer.getElapsedMilliseconds();
      if (time < this.timePerBlock) {
        return true;
      }

      // We have completed the first block
      this.iterationsPerBlock = iterations;
    } else {
      // If we have not yet reached the number of iterations per block, continue
      if (iterations < this.iterationsPerBlock) {
        return true;
      }
    }

    // Record the block
    let time = this.timer.getElapsedMilliseconds();
    let values = this.values;
    values.push(time - this.lastBlockEndTimestamp);
    this.iterationsSinceLastBlock = 0;
    this.lastBlockEndTimestamp = time;

    // Continue until we have reached the desired number of blocks
    return (values.length < this.blockCount);
  }

  private result(): IPerformanceResults {
    // Sort the blocks by execution time
    let values = this.values;
    let iterationsPerBlock = this.iterationsPerBlock;
    let originalCount = values.length * iterationsPerBlock;
    values.sort();

    // Calculate the number of blocks to keep. Keep the ones in the middle.
    let keep = Math.ceil(values.length * (1 - this.discardPercentage));
    let skip = Math.floor(keep / 2);
    values = values.slice(skip, skip + keep);

    // Calculate the average iteration time of the remaining blocks
    let sum = 0;
    values.forEach(value => sum += value);
    let avg = sum / (keep * iterationsPerBlock);

    // Format output string
    let fps = 1000 / avg;
    let msg = `${this.description}\nAverage: ${avg.toFixed(2)} ms (${fps.toFixed(2)} FPS)\n` +
      `Iterations: ${originalCount}`;

    return {
      iterations: originalCount,
      avg: avg,
      fps: fps,
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
  let p = new PerformanceTester();
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
  let p = new PerformanceTester();
  p.description = description;
  p.testAsync = test;
  p.blockCount = blockCount;
  p.timePerBlock = timePerBlock;
  p.discardPercentage = discardPercentage;
  return p.runAsync();
}

/**
 * Renders output the the screen
 * @param canvas Canvas to render
 * @param message Text to overlay onto the image
 * @param maxDimension Maximum dimension of the output canvas, in pixels. If unspecified, the output is unscaled from
 *    the input canvas.
 * @param domCanvasId ID of the canvas element on the DOM. If unspecified, a new one is created.
 */
export async function renderOutput(canvas: FimCanvasBase, message?: string, maxDimension?: number,
    domCanvasId?: string): Promise<void> {
  // Calculate width and height
  let outputDimensions = canvas.dimensions;
  if (maxDimension) {
    outputDimensions = outputDimensions.rescale(maxDimension);
  }

  // Get the output canvas and scale it to the desired size
  let output: HTMLCanvasElement;
  if (domCanvasId) {
    output = document.getElementById(domCanvasId) as HTMLCanvasElement;
  } else {
    output = document.createElement('canvas');
    document.body.appendChild(output);
  }
  output.width = outputDimensions.w;
  output.height = outputDimensions.h;

  // Copy the input canvas to the DOM one
  let ctx = output.getContext('2d');
  ctx.drawImage(canvas.getCanvas(), 0, 0, outputDimensions.w, outputDimensions.h);

  // If we rescaled the output, show a full-resolution detail in the bottom-right corner
  if (maxDimension) {
    // Calculate the output rectangle
    let outputLeft = Math.floor(outputDimensions.w / 2);
    let outputTop = Math.floor(outputDimensions.h / 2);
    let outputRect = FimRect.fromCoordinates(outputLeft, outputTop,
      outputDimensions.xRight, outputDimensions.yBottom);

    // Calculate the input rectangle
    let inputLeft = Math.floor(Math.abs(canvas.w - outputRect.w) / 2);
    let inputTop = Math.floor(Math.abs(canvas.h - outputRect.h) / 2);
    let inputRect = FimRect.fromXYWidthHeight(inputLeft, inputTop, outputRect.w, outputRect.h);

    // Draw the detail view
    ctx.drawImage(canvas.getCanvas(),
      inputRect.xLeft, inputRect.yTop, inputRect.w, inputRect.h,
      outputRect.xLeft, outputRect.yTop, outputRect.w, outputRect.h);
  }

  // Overlay text
  if (message) {
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';

    // Handle multi-line strings. fillText() ignores newlines and carriage returns.
    let y = 16;
    message.split('\n').forEach(line => {
      ctx.fillText(line, 8, y);
      y += 8;
    });

    ctx.restore();
  }
  
  // Give the browser time to render
  return TaskScheduler.yield();
}

/** Copies a FimGLTexture onto a FimGLCanvas */
export function textureToCanvas(gl: FimGLCanvas, texture: FimGLTexture): void {
  using(new FimGLProgramCopy(gl), program => {
    program.setInputs(texture);
    program.execute();
  });
}

// Write GPU details to the screen if there is a <div id="gpu">
$(() => {
  let gpuDiv = $('#gpu');
  if (gpuDiv) {
    using(new FimGLCanvas(320, 320), gl => {
      gpuDiv.text(JSON.stringify(gl.capabilities, null, 4));
    });
  }  
});


//
// Unhandled Exception Handling
//

/** To catch errors before the page load event, we queue them here */
let errorQueue: string[] = [];
let isLoaded = false;

// Register an error handler to catch unhandled exceptions
window.onerror = (event, source, lineno, colno, error) => {
  // Convert the error to a string
  let errorStr: string;
  if (error) {
    errorStr = `Error: ${error.message}\n${error.stack}`;
  } else {
    let eventStr = JSON.stringify(event, null, 4);
    errorStr = `Error: ${eventStr}\n  at ${source}:${lineno}:${colno}`;
  }

  writeError(errorStr);
};

// With promises, this one normally fires instead
window.addEventListener('unhandledrejection', event => {
  // Convert the error to a string
  let reason = event.reason;
  let errorStr: string;
  if (reason instanceof Error) {
    errorStr = `Unhandled Promise Rejection: ${reason.message}\n${reason.stack}`;
  } else {
    errorStr = `Unhandled Promise Rejection: ${reason.toString()}`;
  }
  
  writeError(errorStr);
});

// On page load, display any errors that occurred earlier
$(() => {
  isLoaded = true;
  errorQueue.forEach(writeError);
});

function writeError(error: string): void {
  if (!isLoaded) {
    errorQueue.push(error);
    return;
  }

  // Append the error to <div id="errors">
  let div = $('#errors');
  if (div) {
    div.text(div.text() + '\n' + error);
    div.show(); // Unhide if display: none
  }
}
