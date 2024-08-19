import { Scene } from '../../core/scene';
import { RenderTarget } from '../../core/render-target';
import { RenderPipeline } from '../pipeline';

type RasterizerDescriptor = {};

// Base rasterizer pipeline for meshes
export class Rasterizer extends RenderPipeline {
  private device: GPUDevice;
  private pipelines: GPURenderPipeline[] = [];
  private bindGroupLayouts: Map<string, GPUBindGroupLayout> = new Map();

  constructor(device: GPUDevice, descriptor: RasterizerDescriptor = {}) {
    super();
    this.device = device;
  }

  public render() {
    if (!this.encoder || !this.scene || !this.target) return;

    // for each GPURenderPipeline, we need
    // - geometry vertex buffer layouts
    // - geometry buffer bind group layouts
    // - 
    // - specified target formats

    for (let [ _id, mesh ] of this.scene.meshes) {
      if (!mesh.gpuInitialized) {
        mesh.bindDevice(this.device);
        mesh.initializeAllResources();
      }
    }
  }
}