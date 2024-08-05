import { ResizableTypedArrays } from '../utils/resizable-typed-arrays';

export type GeometryBufferDescriptor = {
  label?: string, 
  typedArrays?: ResizableTypedArrays, 
  /** Size of buffer in bytes (defaults to size of list in bytes) */
  size?: number, 
  usage: number, 
  mappedAtCreation?: boolean
};

/** Holds buffers & typed list for a geometry. */
export class GeometryBuffer {
  protected device?: GPUDevice;
  public buffer?: GPUBuffer;
  public typedArrays: ResizableTypedArrays;

  // WebGPU Buffer descriptions
  protected label?: string;
  protected size: number;
  protected usage: number;
  protected mappedAtCreation?: boolean;

  /** @param descriptor Description of the GeometryBuffer. */
  constructor(descriptor: GeometryBufferDescriptor) {
    this.label = descriptor.label;
    this.size = descriptor.size ?? descriptor.typedArrays?.byteLength ?? 0;
    this.typedArrays = descriptor.typedArrays ?? new ResizableTypedArrays(this.size);
    this.usage = descriptor.usage;
    this.mappedAtCreation = descriptor.mappedAtCreation;
  }

  /** Creates internal buffer using given device. Destroys already existing buffer if there is one. */
  public createGPUBuffer(device: GPUDevice): GPUBuffer {
    if (this.buffer) this.buffer.destroy();
    this.buffer = device.createBuffer({
      label: this.label,
      size: this.size,
      usage: this.usage,
      mappedAtCreation: this.mappedAtCreation
    });
    return this.buffer;
  }

  /** 
   * Issues write operation to internal buffer using internal list data.
   * @param offset Offset to update from given in bytes.
   * @param size Size given in bytes.
   */
  public updateGPUBuffer(offset: GPUSize64 = 0, size?: GPUSize64) {
    if (!this.device || !this.buffer) return;
    if (this.buffer.size < this.typedArrays.byteLength) {
      this.buffer.destroy();
      this.createGPUBuffer(this.device);
    }
    this.device.queue.writeBuffer(this.buffer, offset, this.typedArrays.buffer, offset, size);
  }

  /** 
   * Directly write to internal buffer using given data. Parameters are the same as a device.queue.writeBuffer call.
   * @param bufferOffset Offset in bytes into internal buffer to begin writing at.
   * @param bufferOffset Offset in bytes into internal buffer to begin writing at.
   * @param data Data to write into internal buffer.
   * @param dataOffset Offset in into data to begin writing from. Given in elements if data is a TypedArray and bytes otherwise.
   * @param size Size of content to write from data to buffer. Given in elements if data is a TypedArray and bytes otherwise.
  */
  public writeBufferDirect(bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number, size?: number) {
    if (!this.device || !this.buffer) throw new Error('Buffer not created.');
    this.device.queue.writeBuffer(this.buffer, bufferOffset, data, dataOffset, size);
  }

  /** Destroys internal buffer. */
  public destroy() {
    this.buffer?.destroy();
  }
}