import { RenderTarget } from '../core/render-target';
import { Scene } from '../core/scene';

export abstract class Pipeline {
  // per-pass data
  protected encoder?: GPUCommandEncoder;
}

export abstract class RenderPipeline extends Pipeline {
  public readonly isRenderPipeline: boolean = true;

  // per-pass data
  protected scene?: Scene;
  protected target?: RenderTarget;

  public setPassData(scene: Scene, encoder: GPUCommandEncoder, target: RenderTarget) {
    this.scene = scene;
    this.encoder = encoder;
    this.target = target;
  }
}

export abstract class ComputePipeline extends Pipeline {
  public readonly isComputePipeline: boolean = true;
}