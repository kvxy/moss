
// Holds previously created layouts for each GPUDevice for reuse between multiple bind groups
export class DeviceLayouts {
  public vertexBufferLayouts: Map<string, GPUVertexBufferLayout> = new Map();
  public bindGroupLayouts: Map<string, GPUBindGroupLayout> = new Map();

  public set(key: string, layout: GPUVertexBufferLayout | GPUBindGroupLayout) {
    if ('attributes' in layout) {
      this.vertexBufferLayouts.set(key, layout);
    } else {
      this.bindGroupLayouts.set(key, layout);
    }
  }

  public get(key: string): GPUVertexBufferLayout | GPUBindGroupLayout | undefined {
    return this.getVertexBufferLayout(key) ?? this.getBindGroupLayout(key);
  }

  public getVertexBufferLayout(key: string): GPUVertexBufferLayout | undefined {
    return this.vertexBufferLayouts.get(key);
  }

  public getBindGroupLayout(key: string): GPUBindGroupLayout | undefined {
    return this.bindGroupLayouts.get(key);
  }
}