import { Geometry } from '../geometry/geometry';
import { Material } from '../material/material';
import { Matrix4x4 } from '../utils/matrix4';

export type MeshDescriptor = {
  geometry: Geometry,
  material: Material
};

// Holds vertex data for rendering one object
export class Mesh {
  public geometry: Geometry;
  public material: Material;  
  public matrix: Matrix4x4;

  constructor(descriptor: MeshDescriptor) {
    this.geometry = descriptor.geometry;
    this.material = descriptor.material;
    this.matrix = new Matrix4x4();
  }
}