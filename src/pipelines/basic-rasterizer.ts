import { Scene } from '../core/scene';
import { RenderTarget } from '../core/render-target';
import { RenderPipeline } from './pipeline';

type RasterizerDescriptor = {
  vertexBufferLayout?: GPUVertexBufferLayout
};

// Basic rasterizer pipeline for base material & geometry
export class BasicRasterizer extends RenderPipeline {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline;

  constructor(device: GPUDevice, descriptor: RasterizerDescriptor = {}) {
    super();
    this.device = device;
  }

  public render() {
    if (!this.device || !this.encoder || !this.scene || !this.target) return;
  }
}