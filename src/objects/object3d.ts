import { BufferView } from '../utils/buffer-view';
import { ID } from '../utils/id';
import { Matrix4x4 } from '../utils/math/matrix4x4';
import { Vector3 } from '../utils/math/vector';

/** A 3D object in a scene. */
export class Object3D {
  public id: ID;
  public label: string;

  public position: Vector3;
  public matrix: Matrix4x4;
  public matrixBuffer: BufferView;
  
  constructor(label?: string) {
    this.id = new ID();
    this.label = label ?? this.id.toString();
    this.matrix = new Matrix4x4();
    this.matrixBuffer = new BufferView({
      label: `Mesh ${this.label} Matrix Buffer`,
      arrayBuffer: this.matrix.data.buffer,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.position = new Vector3(0, 0, 0);
  }
}