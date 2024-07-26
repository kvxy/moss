import { Geometry } from '../geometry/geometry';
import { Material } from '../material/material';
import { ID } from '../utils/id';
import { Matrix4x4 } from '../utils/matrix4';

export type MeshDescriptor = {
  id?: string,
  geometry: Geometry,
  material: Material
};

// Holds vertex data for rendering one object
export class Mesh {
  public geometry: Geometry;
  public material: Material;  
  public matrix: Matrix4x4;
  public id: string;

  constructor(descriptor: MeshDescriptor) {
    this.geometry = descriptor.geometry;
    this.material = descriptor.material;
    this.matrix = new Matrix4x4();
    this.id = descriptor.id || new ID().toString();
  }

  public destroy() {
    throw new Error('Method unimplemented.');
  }
}