import { RenderTarget } from '../core/render-target';
import { Scene } from '../core/scene';

import MESH_SHADER from './shader.wgsl?raw'

export type MeshRasterizerPassData = {
  scene: Scene,
  target: RenderTarget,
  encoder: GPUCommandEncoder
};

export type MeshRasterizerOptions = {
  width?: number,
  height?: number
};

/** Rasterizes regular mesh objects. */
export class MeshRasterizer {

  public device: GPUDevice;
  public pipeline: GPURenderPipeline;

  // output textures
  public depthTexture: GPUTexture;

  constructor(device: GPUDevice, options: MeshRasterizerOptions = {}) {
    this.device = device;

    // vertex buffers
    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 4 * 4,
      attributes: [{
        format: 'float32x3', // position
        offset: 0,
        shaderLocation: 0,
      }, {
        format: 'uint8x4', // color
        offset: 12,
        shaderLocation: 1
      }]
    };

    this.depthTexture = device.createTexture({
      size: [ options.width ?? 128, options.height ?? 128 ],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    // pipeline
    const module: GPUShaderModule = device.createShaderModule({
      label: 'Rasterizer Shader Module',
      code: MESH_SHADER
    });

    const pipelineLayout = device.createPipelineLayout({
      label: 'Rasterizer Pipelsine Layout',
      bindGroupLayouts: []
    });

    this.pipeline = device.createRenderPipeline({
      label: 'Rasterizer Pipeline',
      layout: pipelineLayout,
      vertex: {
        module: module,
        entryPoint: 'vertex',
        buffers: [ vertexBufferLayout ]
      },
      fragment: {
        module: module,
        entryPoint: 'fragment',
        targets: [{ format: 'bgra8unorm' }]
      },
      primitive: {
        topology: 'triangle-list'
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    });
  }

  /**
   * Executes one pass of the mesh rasterizer pipeline.
   * @param data Data required for mesh rasterizing pass.
   */
  public pass(data: MeshRasterizerPassData) {
    const encoder = data.encoder;
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: data.target.currentTexture.createView(),
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    });
    
    renderPass.setPipeline(this.pipeline);
    
    for (let mesh of data.scene.meshes) {
      mesh.gpuInitialize(this.device);
      renderPass.setVertexBuffer(0, mesh.geometry.requireBuffer('default').gpuBuffer as GPUBuffer);
      renderPass.draw(3);
    }

    renderPass.end();
    
  }

}