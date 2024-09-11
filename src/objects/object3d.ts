import { BufferView } from '../utils/buffer-view';
import { ID } from '../utils/id';
import { Matrix4x4 } from '../utils/math/matrix4x4';
import { Vector, Vector3 } from '../utils/math/vector';

/** A 3D object in a scene. */
export class Object3D {
  /** Cache of bind group layouts for object3d. */
  public static readonly cache: Map<GPUDevice, {
    bindGroupLayout: GPUBindGroupLayout,
    // references: number // don't really need to delete, low memory usage
  }> = new Map();

  public static readonly bindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'Object Bind Group Layout',
    entries: [{
      binding: 0, // object model matrix
      visibility: GPUShaderStage.VERTEX,
      buffer: {}
    }]
  };

  public id: ID = new ID();
  public label: string;

  public readonly position: Vector3 = new Vector3(0, 0, 0);
  public readonly rotation: Vector3 = new Vector3(0, 0, 0);
  public readonly scale: Vector3 = new Vector3(1, 1, 1);

  public device?: GPUDevice;
  public bindGroup?: GPUBindGroup;
  public matrix: Matrix4x4 = new Matrix4x4();
  public matrixBuffer: BufferView;
  
  constructor(label?: string) {
    this.label = label ?? this.id.toString();
    this.matrixBuffer = new BufferView({
      label: `Object ${this.label} Matrix Buffer`,
      arrayBuffer: this.matrix.data.buffer,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  }

  /** 
   * Creates all resources for this object3d. Called internally.
   * @param device The GPUDevice to initialize with and bind to.
   */
  public gpuInitialize(device: GPUDevice) {
    if (this.device !== undefined) return; // throw new Error('Already initialized with device.');
    this.device = device;
    this.matrixBuffer.createGPUBuffer(device);
    this.createBindGroup();
  }

  /** Creates bind group for object. */
  protected createBindGroup() {
    if (!this.device) throw new Error('Device not initialized.');
    const buffer = this.matrixBuffer.gpuBuffer;
    if (!buffer) throw new Error('Matrix buffer not gpu initialized.');

    // grab layout from cache or create layout and store it in cache
    let layout = Object3D.cache.get(this.device)?.bindGroupLayout;
    if (!layout) {
      layout = this.device.createBindGroupLayout(Object3D.bindGroupLayoutDescriptor);
      Object3D.cache.set(this.device, {
        bindGroupLayout: layout
      });
    }

    this.device.createBindGroup({
      label: 'Object3D Bind Group',
      layout: layout,
      entries: [{
        binding: 0,
        resource: { buffer: buffer }
      }]
    });
  }

  /** Called per render tick. */
  public tick() {
    
  }

  /** Destroys object3d buffers.*/
  public destroy() {
    this.matrixBuffer.destroy();
  }
}