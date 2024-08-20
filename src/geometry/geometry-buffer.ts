import { EventEmitter } from '../utils/event-emitter';
import { ResizableArrayView } from '../utils/resizable-array-view';

export type GeometryBufferDescriptor = {
  label?: string, 
  arrayView?: ResizableArrayView, 
  /** Size of buffer in bytes (defaults to size of list in bytes) */
  size?: number, 
  usage: number, 
  mappedAtCreation?: boolean
};

/** Holds GPUBuffer and internal ArrayBuffer (from ResizableArrayView) for easy buffer manipulation. */
export class GeometryBuffer extends EventEmitter {
  protected device?: GPUDevice;
  public gpuBuffer?: GPUBuffer;
  public arrayView: ResizableArrayView;

  // GPUBuffer descriptors
  protected label?: string;
  protected size: number;
  protected usage: number;
  protected mappedAtCreation?: boolean;

  /** @param descriptor Description of the GeometryBuffer. */
  constructor(descriptor: GeometryBufferDescriptor) {
    super();
    this.label = descriptor.label;
    this.size = descriptor.size ?? descriptor.arrayView?.byteLength ?? 0;
    this.arrayView = descriptor.arrayView ?? new ResizableArrayView(this.size);
    this.usage = descriptor.usage;
    this.mappedAtCreation = descriptor.mappedAtCreation;
  }

  /** 
   * Sets the device of this buffer. 
   * @param device The GPUDevice to bind. */
  public bindDevice(device: GPUDevice) {
    if (this.device !== undefined && this.device !== device) throw new Error('GPUDevice already binded.');
    this.device = device;
  }

  /** Creates internal buffer using given device. Destroys already existing buffer if there is one. */
  public createGPUBuffer() {
    const device = this.device;
    if (!device) throw new Error('No GPUDevice binded.');
    if (this.gpuBuffer) this.gpuBuffer.destroy();
    this.gpuBuffer = device.createBuffer({
      label: this.label,
      size: this.size,
      usage: this.usage,
      mappedAtCreation: this.mappedAtCreation
    });

    this.triggerEvent('onBufferCreate');
  }

  /** 
   * Issues write operation to internal buffer using internal list data.
   * @param offset Offset to update from given in bytes.
   * @param size Size given in bytes.
   */
  public updateGPUBuffer(offset: GPUSize64 = 0, size?: GPUSize64) {
    if (!this.device) throw new Error('No GPUDevice binded.');
    if (!this.gpuBuffer) throw new Error('GPUBuffer not created.');
    const upper = (size ? (offset + size) : this.arrayView.byteLength);
  
    if (this.gpuBuffer.size < upper) {
      this.size = upper;
      this.createGPUBuffer();
    }
    this.device.queue.writeBuffer(this.gpuBuffer, offset, this.arrayView.buffer, offset, upper);
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
    if (!this.gpuBuffer) throw new Error('GPUBuffer not created.');
    this.device.queue.writeBuffer(this.gpuBuffer, bufferOffset, data, dataOffset, size);
  }

  /** Destroys internal buffer. */
  public destroy() {
    this.gpuBuffer?.destroy();
  }
}