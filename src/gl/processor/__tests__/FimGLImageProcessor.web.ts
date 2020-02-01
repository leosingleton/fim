// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLImageProcessor } from '../FimGLImageProcessor';
import { FimGLProgramLinearTransform } from '../../programs/FimGLProgramLinearTransform';
import { FimWeb } from '../../../Fim';
import { ContextLost } from '../../../debug/ContextLost';
import { FimColor } from '../../../primitives/FimColor';
import { using, usingAsync } from '@leosingleton/commonlibs';

function expectToBeCloseTo(actual: FimColor, expected: FimColor): void {
  expect(actual.r).toBeCloseTo(expected.r, -1);
  expect(actual.g).toBeCloseTo(expected.g, -1);
  expect(actual.b).toBeCloseTo(expected.b, -1);
  expect(actual.a).toBeCloseTo(expected.a, -1);
}

enum ObjectID {
  Program,
  Texture
}

class SampleProcessor extends FimGLImageProcessor {
  public constructor(fim: FimWeb, width: number, height: number) {
    super(fim, width, height);

    // Initialize the preserved texture to black
    using(fim.createCanvas(width, height, '#000'), black => {
      const texture = this.getPreservedTexture(ObjectID.Texture);
      texture.copyFrom(black);
    });
  }

  public linearTransformation(m: number, b: number): void {
    const program = this.getProgram(ObjectID.Program, gl => new FimGLProgramLinearTransform(gl));
    const texture = this.getPreservedTexture(ObjectID.Texture);

    // Run the linear transformation program and render to the output
    program.setInputs(texture, m, b);
    program.execute();

    // Copy the output back and preserve it
    texture.copyFrom(this.glCanvas);
    texture.preserve();
  }

  public async simulateContextLoss(): Promise<void> {
    await ContextLost.loseContextAsync(this.glCanvas);
    await ContextLost.restoreContextAsync(this.glCanvas);
  }

  public getColor(): FimColor {
    const glCanvas = this.glCanvas;
    const texture = this.getPreservedTexture(ObjectID.Texture);

    glCanvas.copyFrom(texture);
    return glCanvas.getPixel(5, 5);
  }
}

describe('FimGLImageProcessor', () => {

  it('Performs a basic test', async () => {
    await usingAsync(new FimWeb(), async fim => {
      await usingAsync(new SampleProcessor(fim, 480, 480), async processor => {
        for (let n = 0; n < 10; n++) {
          // Increase brightness by 5%
          processor.linearTransformation(1, 0.05);
        }

        // We expect the texture to be 50% grey
        expectToBeCloseTo(processor.getColor(), FimColor.fromString('#808080'));
      });
    });
  });

  it('Works across context loss', async () => {
    await usingAsync(new FimWeb(), async fim => {
      await usingAsync(new SampleProcessor(fim, 480, 480), async processor => {
        for (let n = 0; n < 10; n++) {
          // Increase brightness by 5%
          processor.linearTransformation(1, 0.05);

          // Simulate context loss
          await processor.simulateContextLoss();
        }

        // We expect the texture to be 50% grey
        expectToBeCloseTo(processor.getColor(), FimColor.fromString('#808080'));
      });
    });
  });

});
