import { RenderTarget } from '../../core/render-target';
import { Scene } from '../../core/scene';
import { Vector3 } from '../../moss';
import { Mesh } from '../../objects/mesh';
import { RenderPipeline } from '../pipeline';

import meshShader from './mesh-shader.wgsl?raw';

export type MeshRasterizerGroup = {
  pipeline: GPURenderPipeline,
  meshes: Map<string, Mesh>
}

export type MeshRasterizerDescriptor = {
  width?: number,
  height?: number
};

// Base rasterizer pipeline for meshes
export class MeshRasterizer extends RenderPipeline {
  private device: GPUDevice;
  protected module: GPUShaderModule;
  protected layout: GPUPipelineLayout;
  
  private groups: Map<string, MeshRasterizerGroup> = new Map();

  // TODO: deferred rendering lighting step using this data
  public depthTexture?: GPUTexture;
  public colorTexture?: GPUTexture;
  public normalTexture?: GPUTexture;
  public emissionTexture?: GPUTexture;

  constructor(device: GPUDevice, descriptor: MeshRasterizerDescriptor = {}) {
    super();
    this.device = device;
    
    this.module = device.createShaderModule({
      label: 'Mesh Rasterizer Shader Module',
      code: meshShader
    });

    this.layout = device.createPipelineLayout({
      label: 'Mesh Rasterizer Pipeline Layout',
      bindGroupLayouts: [
        device.createBindGroupLayout(Scene.bindGroupLayoutDescriptor),
        device.createBindGroupLayout(Mesh.bindGroupLayoutDescriptor)
      ],
    });
  }

  protected getGroup(mesh: Mesh): MeshRasterizerGroup {
    const vertexBufferLayouts = mesh.geometry.getVertexBufferLayouts();
    const groupKey = vertexBufferLayouts.toString();
    let group = this.groups.get(groupKey);
    if (!group) {
      const pipeline = this.device.createRenderPipeline({
        label: 'Mesh Rasterizer Pipeline',
        layout: this.layout,
        vertex: {
          module: this.module,
          entryPoint: 'vertex',
          buffers: vertexBufferLayouts
        },
        fragment: {
          module: this.module,
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
      group = { pipeline, meshes: new Map() };
      this.groups.set(groupKey, group);
    }
    return group;
  }

  public createTextures(width: number, height: number) {
    this.depthTexture?.destroy();
    this.depthTexture = this.device.createTexture({
      label: 'Mesh Rasterizer Depth Texture',
      size: [ width, height ],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
  }

  public render() {
    if (!this.depthTexture && this.target) {
      this.createTextures(this.target.width, this.target.height);
    }

    if (!this.encoder || !this.scene || !this.target || !this.depthTexture) return;

    this.scene.camera.setRotation(this.scene.camera.rotation.add(new Vector3(0.01, 0.01, 0.01)));
    
    for (let [ _id, mesh ] of this.scene.meshes) {
      // TODO: change initialization to scene-on-add
      if (!mesh.gpuInitialized) {
        mesh.bindDevice(this.device);
        mesh.initializeAllResources();
        const group = this.getGroup(mesh);
        group.meshes.set(mesh.id.toString(), mesh);
      }
    }

    const renderPass = this.encoder.beginRenderPass({
      colorAttachments: [{
        view: this.target.currentTexture.createView(),
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

    let sceneBindGroup = this.scene.bindGroup;
    if (!sceneBindGroup) {
      this.scene.bindDevice(this.device);
      sceneBindGroup = this.scene.createBindGroup();
    }
    renderPass.setBindGroup(0, sceneBindGroup);
    for (let [ _key, group ] of this.groups) {
      renderPass.setPipeline(group.pipeline);
      for (let [ _id, mesh ] of group.meshes) {
        renderPass.setBindGroup(1, mesh.bindGroup as GPUBindGroup);
        // not required to do this for every mesh - for shared geometries & index buffers
        renderPass.setVertexBuffer(0, mesh.geometry.getDefaultVertexBuffer().gpuBuffer as GPUBuffer);
        if (mesh.geometry.indexBuffer !== undefined) {
          renderPass.setIndexBuffer(mesh.geometry.indexBuffer.gpuBuffer as GPUBuffer, 'uint16');
          renderPass.drawIndexed(300);
        } else {
          renderPass.draw(6);
        }
      }
    }
    renderPass.end();
  }
}