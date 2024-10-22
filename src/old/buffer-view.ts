import { TypedArray, TypedArrayFormat, TypedArrayMapping } from '../utils/typed-array';

export type BufferViewDescriptor = {
  label?: string,
  mappedAtCreation?: boolean,
  size?: number,
  usage: number,
  type?: 'ArrayBuffer' | 'SharedArrayBuffer',
  arrayBuffer?: ArrayBufferLike,
  resizable?: boolean,
} & ({ // require either arrayBuffer or size
  arrayBuffer: ArrayBufferLike
} | {
  size: number
});

/** Holds GPUBuffer and ArrayBuffer, allows for easy editing of ArrayBuffer and updating data into GPUBuffer. */
export class BufferView {
  protected device?: GPUDevice;
  private _arrayBuffer: ArrayBufferLike;
  private _gpuBuffer?: GPUBuffer | undefined;
  protected typedArrays: Map<TypedArrayFormat, TypedArray> = new Map();
  private resizable: boolean;

  // GPUBuffer descriptors
  public label?: string;
  protected mappedAtCreation?: boolean;
  protected usage: number;

  constructor(descriptor: BufferViewDescriptor) {
    this.label = descriptor.label;
    this.usage = descriptor.usage;
    this.mappedAtCreation = descriptor.mappedAtCreation;
    this.resizable = descriptor.resizable ?? false;

    if (descriptor.arrayBuffer) {
      this._arrayBuffer = descriptor.arrayBuffer;
      return;
    }
    
    if (descriptor.size === undefined) throw new Error('Either size or arrayBuffer must be supplied in BufferViewDescriptor.');
    if (descriptor.type === 'SharedArrayBuffer') {
      this._arrayBuffer = new SharedArrayBuffer(descriptor.size);
    } else {
      this._arrayBuffer = new ArrayBuffer(descriptor.size); // create default
    }
  }

  public get gpuInitialized(): boolean {
    return this.device !== undefined;
  }

  public get arrayBuffer(): ArrayBufferLike {
    return this._arrayBuffer;
  }

  public get gpuBuffer(): GPUBuffer | undefined {
    return this._gpuBuffer;
  }

  /**
   * Returns TypedArray with internal ArrayBuffer.
   * @param format TypedArray format to get.
   * @returns TypedArray of given type with buffer.
   */
  public getTypedArray(format: TypedArrayFormat): TypedArray {
    let typedArray = this.typedArrays.get(format);
    if (typedArray === undefined) {
      typedArray = new (TypedArrayMapping.getConstructor(format))(this._arrayBuffer);
      this.typedArrays.set(format, typedArray);
    }
    return typedArray;
  }

  /**
   * Resizes the buffer view. 
   * WARNING: internal buffers will be recreated, old buffers will be destroyed.
   * If internal GPUBuffer was in a bind group, make sure to recreate that bind group with new GPUBuffer! 
   * @param size The size to resize to in bytes.
   */
  public resize(size: number) {
    if (!this.resizable) throw new Error('BufferView is not resizable. Set resizable=true when constructing BufferView.');
    // create new arrayBuffer
    const newArrayBuffer = new (this._arrayBuffer.constructor as new (byteLength: number) => ArrayBufferLike)(size);
    (new Uint8Array(newArrayBuffer)).set(this.typedArrays.get('uint8') ?? new Uint8Array(this._arrayBuffer));
    this.typedArrays = new Map(); // reset internal typedArrays
    this._arrayBuffer = newArrayBuffer;
    
    // create new gpuBuffer (if needed)
    if (!this.device) return;
    this._gpuBuffer?.destroy();
    this._gpuBuffer = this.device.createBuffer({
      label: this.label,
      mappedAtCreation: this.mappedAtCreation,
      size: this._arrayBuffer.byteLength,
      usage: this.usage
    });
  }

  /** The size in bytes of this buffer view. */
  public get size(): number {
    return this._arrayBuffer.byteLength;
  }

  /**
   * Creates internal GPUBuffer using device. 
   * Should be called internally when buffer view's parent object is added to a scene.
   * @param device The GPUDevice to use.
   */
  public createGPUBuffer(device: GPUDevice) {
    if (this._gpuBuffer) throw new Error('GPUBuffer has already been created.');
    this.device = device;
    this._gpuBuffer = device.createBuffer({
      label: this.label,
      mappedAtCreation: this.mappedAtCreation,
      size: this._arrayBuffer.byteLength,
      usage: this.usage
    });
  } 

  /** 
   * Issues write operation to internal buffer using internal list data.
   * @param offset Offset to write/read to given in bytes.
   * @param size Size given in bytes.
   */
  public updateGPUBuffer(offset: number = 0, size?: number) {
    if (!this.device) throw new Error('No GPUDevice binded.');
    if (!this._gpuBuffer) throw new Error('GPUBuffer not created.');
    this.device.queue.writeBuffer(this._gpuBuffer, offset, this._arrayBuffer, offset, size);
  }

  /** 
   * Directly write to internal buffer using given data. Parameters are the same as a device.queue.writeBuffer call.
   * @param bufferOffset Offset in bytes into internal buffer to begin writing at.
   * @param bufferOffset Offset in bytes into internal buffer to begin writing at.
   * @param data Data to write into internal buffer.
   * @param dataOffset Offset in into data to begin writing from. Given in elements if data is a TypedArray and bytes otherwise.
   * @param size Size of content to write from data to buffer. Given in elements if data is a TypedArray and bytes otherwise.
  */
  public writeGPUBufferDirect(bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number, size?: number) {
    if (!this.device) throw new Error('No GPUDevice binded.');
    if (!this._gpuBuffer) throw new Error('GPUBuffer not created.');
    this.device.queue.writeBuffer(this._gpuBuffer, bufferOffset, data, dataOffset, size);
  }

  /** Destroys internal buffers. */
  public destroy() {
    this.gpuBuffer?.destroy();
  }
}