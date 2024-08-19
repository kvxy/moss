import { ID } from '../utils/id';
import { Matrix4x4 } from '../utils/math/matrix4x4';

/** A 3D object in a scene. */
export class Object3D {
  public id: ID;
  public label: string;

  public matrix: Matrix4x4;
  
  constructor(label?: string) {
    this.id = new ID();
    this.label = label ?? this.id.toString();
    this.matrix = new Matrix4x4();
  }
}