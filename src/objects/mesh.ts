import { Geometry } from '../geometry/geometry';
import { Material } from '../material/material';
import { ID } from '../utils/id';
import { Matrix4x4 } from '../utils/math/matrix4x4';
import { Object3D } from './object3d';

export type MeshDescriptor = {
  label?: string,
  geometry: Geometry,
  material: Material
};

/** Renderable mesh. Holds geometry, material, and per-mesh data. */
export class Mesh extends Object3D {
  protected device?: GPUDevice;
  
  public gpuInitialized: boolean = false;
  public gpuBuffers: Map<string, GPUBuffer> = new Map();
  public geometry: Geometry;
  public materials: Material[];  

  constructor(descriptor: MeshDescriptor) {
    super(descriptor.label);

    this.geometry = descriptor.geometry;
    this.materials = [ descriptor.material ];
    this.matrix = new Matrix4x4();
  }

  /** 
   * Sets the device of geometry, done automatically on render.
   * @param device The GPUDevice to bind. */
  public bindDevice(device: GPUDevice) {
    if (this.device !== undefined && this.device !== device) throw new Error('GPUDevice already binded.');
    this.device = device;
  }

  /** Creates all resources for this mesh (if needed), including geometry bind group / buffers, material bind group / buffers, mesh bind group / buffers. */
  public initializeAllResources() {   
    const device = this.device;
    if (!device) throw new Error('No GPUDevice binded');

    if (!this.geometry.gpuInitialized) {
      this.geometry.bindDevice(device);
      this.geometry.initializeGPUBuffers();
      this.geometry.createBindGroup();
    }

    /*this.gpuBuffers.set('matrixBuffer', device.createBuffer({
      label: `Mesh ${this.label} Matrix Buffer`,
      size: this.matrix.data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }));*/

    this.gpuInitialized = true;
  }

  public destroy() {
    throw new Error('Method unimplemented.');
  }
}