// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Stopwatch } from '@leosingleton/commonlibs';
import { Fim, FimCapabilities, FimDimensions } from '@leosingleton/fim';

/** Stopwatch used to track elapsed time from page load. Used for animation and FPS calculations. */
const elapsedClock = Stopwatch.startNew();

/** Stopwatch used to track only execution time of rendering operations */
const executionClock = new Stopwatch();

/** Number of frames rendered */
let frameCount = 0;

/**
 * Calculates and returns a value
 * @param period Period of one loop of the animation, in milliseconds
 * @param minValue Minimum value to return
 * @param maxValue Maximum value to return
 * @param offset Starting time offset, in milliseconds
 * @returns A value in the range `[minValue, maxValue]`
 */
export function getAnimationValue(period: number, minValue = 0, maxValue = 1, offset = 0): number {
  let value = ((elapsedClock.getElapsedMilliseconds() + offset) % period) * 2 / period;
  if (value > 1) {
    value = 2 - value;
  }

  const delta = maxValue - minValue;
  return value * delta + minValue;
}

/**
 * This function calculates the correct dimensions to enable high device pixel ratio (High DPR) support on a canvas. It
 * should be called regularly during the lifetime of the canvas, as the browser window could move to a different monitor
 * with a different DPR.
 * @param canvas Canvas to enable high DPR support on
 * @param dimensions Dimensions for the canvas
 * @param capabilities Client capabilities
 */
export function enableHighDprCanvas(
  canvas: HTMLCanvasElement,
  dimensions: FimDimensions,
  capabilities: FimCapabilities
): void {
  // To prevent crashes on Safari for iOS, or any other browsers with low maximum canvas dimensions, limit the canvas
  // dimensions to the capabilities reported by FIM.
  dimensions = dimensions.fitInsideSquare(capabilities.maxCanvasSize);

  const dpr = window.devicePixelRatio || 1;
  const expectedCssWidth = dimensions.w / dpr;
  const expectedCssHeight = dimensions.h / dpr;
  if (canvas.width !== dimensions.w || canvas.height !== dimensions.h ||
      canvas.clientWidth !== expectedCssWidth || canvas.clientHeight !== expectedCssHeight) {
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;
    canvas.style.width = expectedCssWidth + 'px';
    canvas.style.height = expectedCssHeight + 'px';
  }
}

/** Called at the beginning of rendering one frame */
export function measureFrameStart(): void {
  executionClock.startTimer();
}

/** Called at the end of rendering one frame */
export function measureFrameStop(): void {
  executionClock.stopTimer();
  frameCount++;
}

/**
 * Renders details to the output canvas
 * @param fim FIM instance
 * @param canvas Output canvas
 * @param message Optional message string to render
 * @param showFPS If true, renders FPS details. This requires the sample app to call `measureFrameStart()` /
 *    `measureFrameStop()` to collect FPS metrics.
 * @param showResources If true, renders the resource metrics from FIM
 * @param showExecutionStats If true, renders the execution stats from FIM
 * @param showCapabilities If true, renders the capabilities
 */
export function renderDetails(fim: Fim, canvas: HTMLCanvasElement, message?: string, showFPS = true,
    showResources = true, showExecutionStats = true, showCapabilities = true): void {
  message = message ?? '';
  message += `\nResolution: ${canvas.width}x${canvas.height}\n\n`;

  if (showFPS) {
    const executionTime = executionClock.getElapsedMilliseconds();
    const avgExecutionTime = Math.round(executionTime / frameCount);
    const elapsedTime = elapsedClock.getElapsedMilliseconds();
    const fps = Math.round(frameCount * 1000 / elapsedTime);
    const cpu = Math.round(executionTime * 100 / elapsedTime);
    message += `Frames: ${frameCount}\nAvg. Execution Time: ${avgExecutionTime} ms (${fps} FPS) ${cpu}% CPU\n\n`;
  }

  if (showResources) {
    const metrics = JSON.stringify(fim.getResourceMetrics(), null, 4);
    message += `Resource Totals = ${metrics}\n\n`;

    const details = JSON.stringify(fim.getResourceMetricsDetailed(), null, 4);
    message += `Resource Details = ${details}\n\n`;
  }

  if (showExecutionStats) {
    const stats = JSON.stringify(fim.getExecutionStats(), null, 4);
    message += `Execution Stats = ${stats}\n\n`;
  }

  if (showCapabilities) {
    const caps = JSON.stringify(fim.capabilities, null, 4);
    message += `Capabilities = ${caps}\n\n`;
  }

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';

  // Handle multi-line strings. fillText() ignores newlines and carriage returns.
  let x = 48;
  let y = 48;
  for (const line of message.split('\n')) {
    ctx.fillText(line, x, y);
    y += 24;

    // Wrap the screen
    if (y > canvas.height - 48) {
      x += 640;
      y = 48;
    }
  }

  ctx.restore();
}
