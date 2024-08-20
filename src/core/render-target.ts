export type RenderTargetDescriptor = {
  device: GPUDevice,
  context?: GPUCanvasContext,
  format?: GPUTextureFormat,
  width: number,
  height: number
} | {
  device: GPUDevice,
  context: GPUCanvasContext,
  format?: GPUTextureFormat,
  width?: number,
  height?: number
};

// TODO: Change to ONLY color, move depth into rendering step for deferred rendering & raytracing pipelines.
/** Color and depth texture to render (can be from ) */
export class RenderTarget {
  private context?: GPUCanvasContext;
  public texture: GPUTexture;
  public format: GPUTextureFormat;

  constructor(descriptor: RenderTargetDescriptor) {
    this.context = descriptor.context;
    this.texture = descriptor.context?.getCurrentTexture() ?? descriptor.device.createTexture({
      size: [ descriptor.width as number, descriptor.height as number ],
      format: descriptor.format ?? 'bgra8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.format = this.texture.format;
  }

  public get currentTexture(): GPUTexture {
    if (this.context) this.texture = this.context.getCurrentTexture();
    return this.texture;
  }

  public get width(): number {
    return this.texture.width;
  }

  public get height(): number {
    return this.texture.height;
  }
}