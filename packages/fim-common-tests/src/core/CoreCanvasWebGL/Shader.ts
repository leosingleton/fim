// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { green, grey, midpoint, red, small } from '../../common/Globals';
import { fillConstShader, fillUniformShader } from '../../common/Shaders';
import { using } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL, CoreShader } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for shaders */
export function coreCanvasWebGLTestSuiteShader(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Shader - ${description}`, () => {

    it('Creates and disposes', () => {
      using(factory(small), canvas => {
        const shader = canvas.createCoreShader(fillConstShader);
        shader.dispose();
      });
    });

    it('Disposes automatically', () => {
      let shader: CoreShader;

      using(factory(small), canvas => {
        shader = canvas.createCoreShader(fillConstShader);
      });

      // Since the parent canvas was disposed, dispose() on the child object will throw an exception
      expect(() => shader.dispose()).toThrow();
    });

    it('Executes a simple fill shader', () => {
      using(factory(small), canvas => {
        const shader = canvas.createCoreShader(fillUniformShader);

        // Fill the output with the color red
        shader.setUniforms({
          uColor: [1, 0, 0, 1]
        });
        shader.execute();

        // Ensure the output is red
        expect(canvas.getPixel(midpoint(small))).toEqual(red);
      });
    });

    it('Executes a simple fill shader with a constant, outputting to a texture', () => {
      using(factory(small), canvas => {
        const shader = canvas.createCoreShader(fillConstShader);
        const texture = canvas.createCoreTexture();

        // Fill the texture with the color green
        shader.setConstants({
          cColor: 0.5
        });
        shader.execute(texture);

        // Render the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the output is grey
        expect(canvas.getPixel(midpoint(small)).distance(grey)).toBeLessThan(0.05);
      });
    });

    it('Executes a simple fill shader with a uniform, outputting to a texture', () => {
      using(factory(small), canvas => {
        const shader = canvas.createCoreShader(fillUniformShader);
        const texture = canvas.createCoreTexture();

        // Fill the texture with the color green
        shader.setUniform('uColor', [0, 1, 0, 1]);
        shader.execute(texture);

        // Render the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the output is green
        expect(canvas.getPixel(midpoint(small))).toEqual(green);
      });
    });

  });
}