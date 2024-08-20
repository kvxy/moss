import { RenderTarget } from '../../core/render-target';
import { RenderPipeline } from '../pipeline';

import meshShader from './mesh-shader.wgsl?raw';

export type MeshRasterizerDescriptor = {};

// Base rasterizer pipeline for meshes
export class MeshRasterizer extends RenderPipeline {
  private device: GPUDevice;
  // private module: GPUShaderModule;
  private pipelines: Map<string, GPURenderPipeline> = new Map();
  private bindGroupLayouts: Map<string, GPUBindGroupLayout> = new Map();

  public depthMap?: GPUTexture;
  public colorMap?: GPUTexture;
  public normalMap?: GPUTexture;

  constructor(device: GPUDevice, descriptor: MeshRasterizerDescriptor = {}) {
    super();
    this.device = device;
    
    const module = device.createShaderModule({
      label: 'Mesh Rasterizer Shader Module',
      code: meshShader
    });

    const layout = device.createPipelineLayout({
      label: 'Mesh Rasterizer Pipeline Layout',
      bindGroupLayouts: [
        device.createBindGroupLayout({
          entries: []
        })
      ],
    });

    const pipeline = device.createRenderPipeline({
      label: 'Mesh Rasterizer Pipeline',
      layout: layout,
      vertex: {
        module: module,
        entryPoint: 'vertex',
        buffers: [{

        }]
      },
      fragment: {
        module: module,
        entryPoint: 'fragment',
        targets: [{ format: '' }]
      },
      primitive: {
        topology: 'triangle-list'
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: target.depthFormat
      }
    });
  }

  public render() {
    if (!this.encoder || !this.scene || !this.target) return;

    /*const renderPass = this.encoder.beginRenderPass({
      
    });*/

    for (let [ _id, mesh ] of this.scene.meshes) {
      if (!mesh.gpuInitialized) {
        // this.createPipeline(mesh.geometry.getVertexBufferLayouts(), [ mesh ])
        mesh.bindDevice(this.device);
        mesh.initializeAllResources();
      }

    }
  }
}