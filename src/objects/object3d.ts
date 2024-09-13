import { BufferView } from '../utils/buffer-view';
import { ID } from '../utils/id';
import { Matrix4x4 } from '../utils/math/matrix4x4';
import { Vector, Vector3 } from '../utils/math/vector';

export type Object3DDescriptor = {
  label?: string,
  static?: boolean
};

/** A 3D object in a scene. */
export class Object3D {
  /** Cache bind group layouts per device for object3d. */
  public static readonly layoutCache: Map<GPUDevice, GPUBindGroupLayout> = new Map();

  public static readonly bindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'Object Bind Group Layout',
    entries: [{
      binding: 0, // object model matrix
      visibility: GPUShaderStage.VERTEX,
      buffer: {}
    }]
  };

  /**
   * Creates and caches object3d data (bind group layout) for given device.
   * If data was previous created and cached, return previously cached data.
   * @param device Device to use to create device-specific data.
   * @returns The data created.
   */
  public static createAndCacheLayout(device: GPUDevice): GPUBindGroupLayout {
    let layout = this.layoutCache.get(device);
    if (layout) return layout;

    layout = device.createBindGroupLayout(Object3D.bindGroupLayoutDescriptor);
    this.layoutCache.set(device, layout);
    return layout;
  }

  /**
   * Gets cached object3d data from cache.
   * @param key Key of data to get (GPUDevice).
   * @returns bind group layout data from cache, returns undefined if data does not exist in cache.
   */
  public static getLayout(key: GPUDevice): GPUBindGroupLayout | undefined {
    return this.layoutCache.get(key);
  }

  public id: ID = new ID();
  public label: string;

  public static: boolean;

  public readonly position: Vector3 = new Vector3(0, 0, 0);
  public readonly rotation: Vector3 = new Vector3(0, 0, 0);
  public readonly scale: Vector3 = new Vector3(1, 1, 1);
  public worldMatrix: Matrix4x4;
  private needMatrixUpdate: boolean = false;

  public device?: GPUDevice;
  public bindGroup?: GPUBindGroup;
  public buffer: BufferView;
  private needBufferUpdate: boolean = false;
  
  constructor(descriptor: Object3DDescriptor = {}) {
    this.label = descriptor.label ?? this.id.toString();
    this.buffer = new BufferView({
      label: `Object ${this.label} Buffer`,
      size: Matrix4x4.BYTE_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.static = descriptor.static ?? false;

    this.worldMatrix = new Matrix4x4(this.buffer.arrayBuffer, 0);
    this.worldMatrix.makeIdentity();

    if (!this.static) {
      this.position.addEventListener('onUpdate', this.flagMatrixUpdate);
      this.rotation.addEventListener('onUpdate', this.flagMatrixUpdate);
      this.scale.addEventListener('onUpdate', this.flagMatrixUpdate);
      this.worldMatrix.addEventListener('onUpdate', this.flagBufferUpdate);
    }
  }

  /** 
   * Creates all resources for this object3d. Called internally.
   * @param device The GPUDevice to initialize with and bind to.
   */
  public gpuInitialize(device: GPUDevice) {
    if (this.device !== undefined) return; // throw new Error('Already initialized with device.');
    this.device = device;
    this.buffer.createGPUBuffer(device);
    this.buffer.updateGPUBuffer();
    this.createBindGroup();
  }

  /** Creates bind group for object. */
  protected createBindGroup() {
    if (!this.device) throw new Error('Device not initialized.');
    const buffer = this.buffer.gpuBuffer;
    if (!buffer) throw new Error('Matrix buffer not gpu initialized.');

    // grab layout from cache or create layout and store it in cache
    const layout = (Object3D.getLayout(this.device) ?? Object3D.createAndCacheLayout(this.device));

    this.bindGroup = this.device.createBindGroup({
      label: 'Object3D Bind Group',
      layout: layout,
      entries: [{
        binding: 0,
        resource: { buffer: buffer }
      }]
    });
  }

  /** Updates object3d world matrix. This is done automatically on tick. */
  public updateMatrix() {
    this.worldMatrix.makeIdentity();
    this.worldMatrix.translate(this.position);
    this.worldMatrix.rotate(this.rotation);
    this.worldMatrix.scale(this.scale);
  }
  
  /** Flags gpu buffer for update. */
  protected flagBufferUpdate() {
    this.needBufferUpdate = true;
  }

  /** Flags world matrix for update. */
  protected flagMatrixUpdate() {
    this.needMatrixUpdate = true;
  }

  /** Called per render tick. */
  public tick() {
    if (!this.static) {
      if (this.needMatrixUpdate) {
        this.updateMatrix();
      }
      if (this.needBufferUpdate && this.buffer.gpuInitialized) {
        this.buffer.updateGPUBuffer();
      }
    }
  }

  /** Destroys object3d buffers.*/
  public destroy() {
    this.buffer.destroy();
  }
}