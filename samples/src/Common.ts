// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, FimCanvasBase, FimGLCanvas, FimGLProgramCopy, FimGLTexture } from '../../build/dist/index.js';
import { Stopwatch, TaskScheduler, parseQueryString, using } from '@leosingleton/commonlibs';

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

class PerformanceTester {
  public description: string;
  public test: () => void;
  public testAsync: () => Promise<void>;
  public blockCount: number;
  public iterationsPerBlock: number;
  public discardPercentage: number;

  public run(): string {
    this.init();
    do {
      this.test();
    } while (this.shouldContinue());
    return this.result();
  }

  public async runAsync(): Promise<string> {
    this.init();
    do {
      await this.testAsync();
    } while (this.shouldContinue());
    return this.result();
  }

  private values: number[];
  private iterationsSinceLastBlock: number;
  private lastBlockEndTimestamp: number;
  private timer: Stopwatch;

  private init(): void {
    this.values = [];
    this.iterationsSinceLastBlock = 0;
    this.lastBlockEndTimestamp = 0;
    this.timer = Stopwatch.startNew();
  }

  private shouldContinue(): boolean {
    // If we have not yet reached the number of iterations per block, continue
    let iterations = ++this.iterationsSinceLastBlock;
    if (iterations < this.iterationsPerBlock) {
      return true;
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

  private result(): string {
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
    return `${this.description}\nAverage: ${avg.toFixed(2)} ms (${fps.toFixed(2)} FPS)\nIterations: ${originalCount}`;
  }
}

/**
 * Measures the performance of an operation
 * @param description Description of the operation
 * @param test Lambda function to test
 * @param blockCount Number of execution blocks to measure. We repeat the test this number of times to discard the
 *    highest and lowest values.
 * @param iterationsPerBlock Number of times to execute the test within each block. Timers in JavaScript only have
 *    an accuracy of 1 ms or so, therefore it's best to repeat until each block takes 20 ms or more.
 * @param discardPercentage Percentage of iteration blocks to discard (0.0 to 1.0). We drop the highest and lowest and
 *    return the average of the remaining blocks.
 * @returns String with a message containing the results
 */
export function perfTest(description: string, test: () => void, blockCount = 10, iterationsPerBlock = 50,
    discardPercentage = 0.5): string {
  let p = new PerformanceTester();
  p.description = description;
  p.test = test;
  p.blockCount = blockCount;
  p.iterationsPerBlock = iterationsPerBlock;
  p.discardPercentage = discardPercentage;
  return p.run();
}

/**
 * Measures the performance of an async operation
 * @param description Description of the operation
 * @param test Async lambda function to test
 * @param blockCount Number of execution blocks to measure. We repeat the test this number of times to discard the
 *    highest and lowest values.
 * @param iterationsPerBlock Number of times to execute the test within each block. Timers in JavaScript only have
 *    an accuracy of 1 ms or so, therefore it's best to repeat until each block takes 20 ms or more.
 * @param discardPercentage Percentage of iteration blocks to discard (0.0 to 1.0). We drop the highest and lowest and
 *    return the average of the remaining blocks.
 * @returns String with a message containing the results
 */
export function perfTestAsync(description: string, test: () => Promise<void>, blockCount = 10,
    iterationsPerBlock = 50, discardPercentage = 0.5): Promise<string> {
  let p = new PerformanceTester();
  p.description = description;
  p.testAsync = test;
  p.blockCount = blockCount;
  p.iterationsPerBlock = iterationsPerBlock;
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
