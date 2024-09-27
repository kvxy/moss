import { Geometry } from './goemetry2';

export class WebGPUGeometry {
  private device: GPUDevice;
  private vertexBuffers: GPUBuffer[] = [];
  private indexBuffer?: GPUBuffer;

  constructor(geometry: Geometry, device: GPUDevice) {
    this.device = device;
    
  }
}