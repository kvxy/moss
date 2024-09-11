import { MeshRasterizer } from '../pipelines/mesh-rasterizer/mesh-rasterizer';
import { ID } from '../utils/id';
import { RenderTarget } from './render-target';
import { Scene } from './scene';

/** WebGPU engine for client-side graphics. */
export class WebGPUEngine {
  public id: ID = new ID();

  public device?: GPUDevice;
  public canvas: HTMLCanvasElement = document.createElement('canvas');
  public context?: GPUCanvasContext;
  public target?: RenderTarget;

  public pass: (engine: this, encoder: GPUCommandEncoder, scene: Scene, target: RenderTarget) => any = () => {};
  public onInit: (engine: this) => any = () => {};

  constructor(initialize: boolean = true, useBasicRasterizer: boolean = true) {
    if (useBasicRasterizer) {
      let meshRasterizer: MeshRasterizer | undefined = undefined;
      this.onInit = (engine: this) => {
        if (!engine.device) return;
        meshRasterizer = new MeshRasterizer(engine.device, {
          width: engine.canvas.width,
          height: engine.canvas.height
        });
      };
      this.pass = (_engine, encoder, scene, target) => {
        if (meshRasterizer === undefined) return;
        meshRasterizer.pass({ encoder, scene, target });
      }
    }
    if (initialize) this.Initialize();
  }

  /** Initializes the engine. */
  public async Initialize() {
    // setup
    if (!navigator.gpu) throw new Error('WebGPU is not supported on this browser.');

    const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('Failed to get WebGPU adapter');

    const device = this.device = await adapter.requestDevice({
      label: `Device ${this.id.toString()}$`,
      requiredFeatures: ['bgra8unorm-storage']
    });

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
      format: textureFormat,
      height: canvas.height,
      width: canvas.width
    });

    this.onInit(this);
  }

  /**
   * Renders the scene to target.
   * @param scene The scene to render.
   * @param target The target to render to, if no target is specified, scene is rendered to internal canvas.
   */
  public render(scene: Scene, target?: RenderTarget) {
    if (!this.device || !this.target) return;
    const encoder = this.device.createCommandEncoder();
    this.pass(this, encoder, scene, target ?? this.target);
    this.device.queue.submit([ encoder.finish() ]);
  }
}