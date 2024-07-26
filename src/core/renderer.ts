import { BasicRasterizer } from '../pipelines/basic-rasterizer';
import { ComputePipeline, Pipeline, RenderPipeline } from '../pipelines/pipeline';
import { RenderTarget } from './render-target';
import { Scene } from './scene';

// WebGPU renderer for client-side graphics
export class Renderer {
  public device?: GPUDevice;
  public canvas: HTMLCanvasElement = document.createElement('canvas');
  public context?: GPUCanvasContext;
  public target?: RenderTarget;

  public pass: (renderer: this) => any = () => {};
  public onInit: (renderer: this) => any = () => {};
  public renderPipelines: Map<string, RenderPipeline> = new Map(); 
  public computePipelines: Map<string, ComputePipeline> = new Map(); 
  public resources: Map<string, any> = new Map(); // shared pipeline resources

  constructor(initialize: boolean = true, useBasicRasterizer: boolean = true) {
    if (useBasicRasterizer) {
      this.onInit = (renderer: this) => {
        if (!renderer.device) return;
        this.setPipeline('rasterizer', new BasicRasterizer(renderer.device));
      };
      this.pass = (renderer: this) => {
        const rasterizer = this.getRenderPipeline('rasterizer') as BasicRasterizer;
        if (!rasterizer) return;
        rasterizer.render();
      }
    }
    if (initialize) this.Initialize();
  }

  public async Initialize() {
    // setup
    if (!navigator.gpu) throw new Error('WebGPU is not supported on this browser.');

    const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('Failed to get WebGPU adapter');

    const device = this.device = await adapter.requestDevice({ requiredFeatures: ['bgra8unorm-storage'] });

    // canvas & context
    const canvas = this.canvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.left = '0px';
    canvas.style.top = '0px';

    const context = this.context = canvas.getContext('webgpu') ?? undefined;
    if (!context) throw new Error('Failed to get WebGPU context');

    const textureFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device: device,
      format: textureFormat
    });

    this.target = new RenderTarget({
      device: device,
      context: context,
      colorFormat: textureFormat,
      depthFormat: 'depth24plus',
      height: canvas.height,
      width: canvas.width
    });

    this.onInit(this);
  }

  public setPipeline(key: string, pipeline: RenderPipeline | ComputePipeline) {
    if ('isRenderPipeline' in pipeline) {
      this.renderPipelines.set(key, pipeline);
    } else {
      this.computePipelines.set(key, pipeline);
    }
  }

  public getPipeline(key: string): Pipeline | ComputePipeline | undefined {
    return this.getRenderPipeline(key) ?? this.getComputePipeline(key);
  }

  public getRenderPipeline(key: string): RenderPipeline | undefined {
    return this.renderPipelines.get(key);
  }

  public getComputePipeline(key: string): ComputePipeline | undefined {
    return this.computePipelines.get(key);
  }

  public render(scene: Scene, target?: RenderTarget) {
    if (!this.device || !this.target) return;

    const encoder = this.device.createCommandEncoder();
    for (let [ _key, pipeline ] of this.renderPipelines) {
      pipeline.setPassData(scene, encoder, target ?? this.target);
    }
    this.pass(this);
    this.device.queue.submit([ encoder.finish() ]);
  }
}