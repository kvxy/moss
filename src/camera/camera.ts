import { Matrix4x4 } from '../utils/math/matrix4x4';
import { Vector3 } from '../utils/math/vector';

export abstract class Camera {
  public static byteSize = 16 * 4 * 2;

  public position: Vector3 = new Vector3(0, 0, 0);
  public rotation: Vector3 = new Vector3(0, 0, 0);

  public projectionMatrix: Matrix4x4  = new Matrix4x4();
  public worldMatrix: Matrix4x4  = new Matrix4x4();;

  protected device?: GPUDevice;
  protected matrixBuffer?: GPUBuffer;
  
  constructor() {
    this.setPerspective();
    this.setPosition(this.position);
    this.setRotation(this.rotation);
  }

  public abstract setPerspective(): void;

  public setPosition(position: Vector3) {
    this.position.copy(position);
    this.updateWorldMatrix();
  }

  public move(vector: Vector3) {
    this.position.add(vector);
    this.updateWorldMatrix();
  }

  public setRotation(rotation: Vector3) {
    this.rotation.copy(rotation);
    this.updateWorldMatrix();
  }

  protected updateWorldMatrix() {
    this.worldMatrix.makeIdentity();
    this.worldMatrix.rotateX(this.rotation.x);
    this.worldMatrix.rotateY(this.rotation.y);
    this.worldMatrix.rotateZ(this.rotation.z);
    this.worldMatrix.translate(this.position);

    this.updateBuffer();
  }

  protected updateBuffer() {
    if (!this.device || !this.matrixBuffer) return;
    this.device.queue.writeBuffer(this.matrixBuffer, 0, new Float32Array([
      ...this.projectionMatrix.data,
      ...this.worldMatrix.data
    ]));
  }

  public createBuffer(device: GPUDevice): GPUBuffer {
    this.device = device;
    this.matrixBuffer = device.createBuffer({
      size: Camera.byteSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.updateBuffer();
    return this.matrixBuffer;
  }

  public destroy() {
    this.matrixBuffer?.destroy();
  }
}