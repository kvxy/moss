import { Matrix4x4 } from '../utils/math/matrix4x4';
import { Object3D } from './object3d';

export class Camera extends Object3D {
  public static readonly BYTE_SIZE = 16 * 4 * 2;

  public projectionMatrix: Matrix4x4  = new Matrix4x4();

  constructor() {
    super();
    // resize buffer and create new matrices to use updated array buffer
    this.buffer.resize(Camera.BYTE_SIZE);
    this.worldMatrix = new Matrix4x4(this.buffer.arrayBuffer, 0);
    this.projectionMatrix = new Matrix4x4(this.buffer.arrayBuffer, Matrix4x4.BYTE_SIZE);
  }

  public tick() {
    super.tick();
  }
}