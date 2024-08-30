import { Geometry } from '../geometry/goemetry';
import { Material } from '../material/material';
import { BufferView } from '../utils/buffer-view';
import { Matrix4x4 } from '../utils/math/matrix4x4';
import { Object3D } from './object3d';

export type MeshDescriptor = {
  label?: string,
  geometry: Geometry,
  material: Material
};

/** Renderable mesh. Holds geometry, material, and per-mesh data. */
export class Mesh extends Object3D {
  public static bindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'Mesh Bind Group Layout',
    entries: [{
      binding: 0, // mesh model matrix
      visibility: GPUShaderStage.VERTEX,
      buffer: {}
    }]
  };

  public readonly isMesh = true;

  protected device?: GPUDevice;
  public bindGroup?: GPUBindGroup;
  public geometry: Geometry;
  public materials: Material[];  

  constructor(descriptor: MeshDescriptor) {
    super(descriptor.label);

    this.geometry = descriptor.geometry;
    this.materials = [ descriptor.material ];
  }

  /** 
   * Sets the device of geometry, done automatically on render.
   * @param device The GPUDevice to bind. 
   */
  public bindDevice(device: GPUDevice) {
    if (this.device !== undefined && this.device !== device) throw new Error('GPUDevice already binded.');
    this.device = device;
  }

  /** Creates all resources for this mesh (if needed), including geometry bind group / buffers, material bind group / buffers, mesh bind group / buffers. */
  

  /** Destroys mesh buffers. Geometry and material are not destroyed. */
  public destroy() {
    this.matrixBuffer.destroy();
  }
}