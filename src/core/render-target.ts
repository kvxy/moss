export type RenderTargetDescriptor = {
  device: GPUDevice,
  context?: GPUCanvasContext,
  colorFormat?: GPUTextureFormat,
  depthFormat?: GPUTextureFormat,
  width: number,
  height: number
} | {
  device: GPUDevice,
  context: GPUCanvasContext,
  colorFormat?: GPUTextureFormat,
  depthFormat?: GPUTextureFormat,
  width?: number,
  height?: number
}

export class RenderTarget {
  public colorTexture: GPUTexture;
  public depthTexture: GPUTexture;
  public colorFormat: GPUTextureFormat;
  public depthFormat: GPUTextureFormat;

  constructor(descriptor: RenderTargetDescriptor) {
    this.colorTexture = descriptor.context?.getCurrentTexture() ?? descriptor.device.createTexture({
      size: [ descriptor.width as number, descriptor.height as number ],
      format: descriptor.colorFormat ?? 'bgra8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.colorFormat = this.colorTexture.format;

    this.depthTexture = descriptor.device.createTexture({
      size: [ (descriptor.context?.canvas.width || descriptor.width) as number, (descriptor.context?.canvas.height || descriptor.height) as number ],
      format: descriptor.depthFormat ?? 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.depthFormat = this.depthTexture.format;
  }
}