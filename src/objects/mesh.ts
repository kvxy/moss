import { Geometry } from '../geometry/goemetry';
import { Material } from '../material/material';
import { Object3D } from './object3d';

export type MeshDescriptor = {
  label?: string,
  geometry: Geometry,
  material: Material
};

/** Renderable mesh. Holds geometry, material, and per-mesh data. */
export class Mesh extends Object3D {
  public readonly isMesh = true;

  public bindGroup?: GPUBindGroup;
  public geometry: Geometry;
  public materials: Material[];

  /** If true (default), mesh will be rendered. */
  public display: Boolean = true;

  constructor(descriptor: MeshDescriptor) {
    super(descriptor.label);
    this.geometry = descriptor.geometry;
    this.materials = [ descriptor.material ];
  }

  /** 
   * Creates all resources for this mesh (if needed), including geometry bind group / buffers, material bind group / buffers, mesh bind group / buffers. 
   * Called internally.
   * @param device The GPUDevice to initialize with and bind to.
   */
  public gpuInitialize(device: GPUDevice) {
    super.gpuInitialize(device);
    this.geometry.gpuInitialize(device);
    // this.materials.gpuInitialize(device);
  }

  /** Destroys mesh buffers. Geometry and material resources are not destroyed. */
  public destroy() {
    super.destroy();
    // destroy other mesh specific buffers when added..
  }
}