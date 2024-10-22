export class WebGPUVertexBuffer {
  private device: GPUDevice;
  public gpuBuffer: GPUBuffer;
  public readonly name: string;

  constructor(device: GPUDevice, descriptor: { name: string, size: number }) {
    this.device = device;
    this.name = descriptor.name;
    this.gpuBuffer = device.createBuffer({
      label: `${descriptor.name} Vertex Buffer (${descriptor.size} bytes)`,
      size: descriptor.size,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
  }

  public async resize(size: number) {
    const encoder = this.device.createCommandEncoder();
    const newBuffer = this.device.createBuffer({
      label: `${this.name} Vertex Buffer (${size} bytes)`,
      size: size,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    encoder.copyBufferToBuffer(this.gpuBuffer, 0, newBuffer, 0, size);
  }
}