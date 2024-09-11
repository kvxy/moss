import { BufferView } from '../utils/buffer-view';
import { ID } from '../utils/id';
import { Matrix4x4 } from '../utils/math/matrix4x4';
import { Vector, Vector3 } from '../utils/math/vector';

type Object3DCacheData = {
  bindGroupLayout: GPUBindGroupLayout
};

export type Object3DDescriptor = {
  label?: string,
  static?: boolean
};

/** A 3D object in a scene. */
export class Object3D {
  /** Cache of bind group layouts for object3d. */
  public static readonly cache: Map<GPUDevice, Object3DCacheData> = new Map();

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
  public static createAndCacheData(device: GPUDevice): Object3DCacheData {
    let data = this.cache.get(device);
    if (data) return data;

    data = { bindGroupLayout: device.createBindGroupLayout(Object3D.bindGroupLayoutDescriptor) };
    this.cache.set(device, data);
    return data;
  }

  /**
   * Gets cached object3d data from cache.
   * @param key Key of data to get (GPUDevice).
   * @returns bind group layout data from cache, returns undefined if data does not exist in cache.
   */
  public static getCacheData(key: GPUDevice): Object3DCacheData | undefined {
    return this.cache.get(key);
  }

  public id: ID = new ID();
  public label: string;

  public static: boolean;

  public readonly position: Vector3 = new Vector3(0, 0, 0);
  public readonly rotation: Vector3 = new Vector3(0, 0, 0);
  public readonly scale: Vector3 = new Vector3(1, 1, 1);

  public device?: GPUDevice;
  public bindGroup?: GPUBindGroup;
  public matrix: Matrix4x4 = new Matrix4x4();
  public matrixBuffer: BufferView;
  
  constructor(descriptor: Object3DDescriptor) {
    this.label = descriptor.label ?? this.id.toString();
    this.matrixBuffer = new BufferView({
      label: `Object ${this.label} Matrix Buffer`,
      arrayBuffer: this.matrix.data.buffer,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.static = descriptor.static ?? false;
  }

  /** 
   * Creates all resources for this object3d. Called internally.
   * @param device The GPUDevice to initialize with and bind to.
   */
  public gpuInitialize(device: GPUDevice) {
    if (this.device !== undefined) return; // throw new Error('Already initialized with device.');
    this.device = device;
    this.matrixBuffer.createGPUBuffer(device);
    this.matrixBuffer.updateGPUBuffer();
    this.createBindGroup();
  }

  /** Creates bind group for object. */
  protected createBindGroup() {
    if (!this.device) throw new Error('Device not initialized.');
    const buffer = this.matrixBuffer.gpuBuffer;
    if (!buffer) throw new Error('Matrix buffer not gpu initialized.');

    // grab layout from cache or create layout and store it in cache
    const cachedData = (Object3D.getCacheData(this.device) ?? Object3D.createAndCacheData(this.device));

    this.bindGroup = this.device.createBindGroup({
      label: 'Object3D Bind Group',
      layout: cachedData.bindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: buffer }
      }]
    });
  }

  /** Called per render tick. */
  public tick() {
    if (!this.static) {
      
    }
  }

  /** Destroys object3d buffers.*/
  public destroy() {
    this.matrixBuffer.destroy();
  }
}