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
  public minIterations: number;
  public maxIterations: number;
  public executionTime: number;

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

  private iterations = 0;
  private time = 0;
  private timer: Stopwatch;

  private init(): void {
    this.timer = Stopwatch.startNew();
  }

  private shouldContinue(): boolean {
    this.iterations++;
    this.time = this.timer.getElapsedMilliseconds();
    return (this.iterations < this.maxIterations && (this.iterations < this.minIterations ||
      this.time < this.executionTime));
  }

  private result(): string {
    let avg = this.time / this.iterations;
    let fps = 1000 / avg;
    return `${this.description}\nAverage: ${avg.toFixed(2)} ms (${fps.toFixed(2)} FPS)\nIterations: ${this.iterations}`;
  }
}

/**
 * Measures the performance of an operation
 * @param description Description of the operation
 * @param test Lambda function to test
 * @param minIterations Minimum number of iterations to run
 * @param maxIterations Maximum number of iterations to run
 * @param executionTime Desired execution time in milliseconds. We will stop testing at this time as long as the number
 *    of iterations is in the min/max range.
 * @returns String with a message containing the results
 */
export function perfTest(description: string, test: () => void, minIterations = 10, maxIterations = 1000,
    executionTime = 1000): string {
  let p = new PerformanceTester();
  p.description = description;
  p.test = test;
  p.minIterations = minIterations;
  p.maxIterations = maxIterations;
  p.executionTime = executionTime;
  return p.run();
}

/**
 * Measures the performance of an async operation
 * @param description Description of the operation
 * @param test Async lambda function to test
 * @param minIterations Minimum number of iterations to run
 * @param maxIterations Maximum number of iterations to run
 * @param executionTime Desired execution time in milliseconds. We will stop testing at this time as long as the number
 *    of iterations is in the min/max range.
 * @returns String with a message containing the results
 */
export function perfTestAsync(description: string, test: () => Promise<void>, minIterations = 10,
    maxIterations = 1000, executionTime = 1000): Promise<string> {
  let p = new PerformanceTester();
  p.description = description;
  p.testAsync = test;
  p.minIterations = minIterations;
  p.maxIterations = maxIterations;
  p.executionTime = executionTime;
  return p.runAsync();
}

/**
 * Renders output the the screen
 * @param canvas Canvas to render
 * @param message Text to overlay onto the image
 * @param domCanvasId ID of the canvas element on the DOM. If unspecified, a new one is created.
 * @param width Width of the output canvas. Defaults to the width of the input canvas.
 * @param height Height of the oputput canvas. Defaults to the height of the input canvas.
 */
export async function renderOutput(canvas: FimCanvasBase, message?: string, domCanvasId?: string, width?: number,
    height?: number): Promise<void> {
  // Default parameters
  width = width || canvas.w;
  height = height || canvas.h;

  // Get the output canvas and scale it to the desired size
  let output: HTMLCanvasElement;
  if (domCanvasId) {
    output = document.getElementById(domCanvasId) as HTMLCanvasElement;
  } else {
    output = document.createElement('canvas');
    document.body.appendChild(output);
  }
  output.width = width;
  output.height = height;

  // Copy the input canvas to the DOM one
  let ctx = output.getContext('2d');
  ctx.drawImage(canvas.getCanvas(), 0, 0, width, height);

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
