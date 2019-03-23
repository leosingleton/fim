// src/fim/GLObject.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>


/** Interface for WebGL objects that receive notifications when the WebGL context is lost or restored */
export interface FimGLObject {
  onContextLost(): void;

  onContextRestored(): void;
}
