import { Matrix4x4 } from '../utils/matrix4';
import { Vector3 } from '../utils/vector';

export abstract class Camera {
  public static byteSize = 16 * 4 * 2;

  protected _position: Vector3 = new Vector3(0, 0, 0);
  protected _rotation: Vector3 = new Vector3(0, 0, 0);

  public projectionMatrix: Matrix4x4  = new Matrix4x4();
  public worldMatrix: Matrix4x4  = new Matrix4x4();;

  protected device?: GPUDevice;
  protected matrixBuffer?: GPUBuffer;
  
  constructor() {
    this.setPerspective();
    this.setPosition(this._position);
    this.setRotation(this._rotation);
  }

  public abstract setPerspective(): void;

  public setPosition(position: Vector3) {
    this._position.copy(position);
    this.updateWorldMatrix();
  }

  public move(vector: Vector3) {
    this._position.add(vector);
    this.updateWorldMatrix();
  }

  public setRotation(rotation: Vector3) {
    this._rotation.copy(rotation);
    this.updateWorldMatrix();
  }

  public get position(): Vector3 {
    return this._position.clone();
  }

  public get rotation(): Vector3 {
    return this._rotation.clone();
  }

  protected updateWorldMatrix() {
    this.worldMatrix.makeIdentity();
    this.worldMatrix.rotateX(this._rotation.x);
    this.worldMatrix.rotateY(this._rotation.y);
    this.worldMatrix.rotateZ(this._rotation.z);
    this.worldMatrix.translate(this._position);

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