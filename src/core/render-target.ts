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
};

// TODO: Change to ONLY color, move depth into rendering step for deferred rendering & raytracing pipelines.
/** Color and depth texture to render (can be from ) */
export class RenderTarget {
  private context?: GPUCanvasContext;
  public colorTexture: GPUTexture;
  public depthTexture: GPUTexture;
  public colorFormat: GPUTextureFormat;
  public depthFormat: GPUTextureFormat;

  constructor(descriptor: RenderTargetDescriptor) {
    this.context = descriptor.context;
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

  public get currentTexture(): GPUTexture {
    if (this.context) this.colorTexture = this.context.getCurrentTexture();
    return this.colorTexture;
  }
}