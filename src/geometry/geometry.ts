import { TypedList } from '../utils/typed-list';

// GPUBufferDescriptor with more optional parameters as a TypedList is given
type GeometryBufferDescriptor = {
  label?: string, 
  list: TypedList, 
  size?: number, 
  usage: number, 
  mappedAtCreation?: boolean
};

/** Holds buffer & typed list for a geometry. */
export class GeometryBuffer {
  protected device?: GPUDevice;
  public buffer?: GPUBuffer;
  public list: TypedList;

  // WebGPU Buffer descriptions
  protected label?: string;
  protected size: number; // (in bytes)
  protected usage: number;
  private mappedAtCreation?: boolean;

  /** @param descriptor Description of the GeometryBuffer. */
  constructor(descriptor: GeometryBufferDescriptor) {
    this.label = descriptor.label;
    this.list = descriptor.list;
    this.size = descriptor.size ?? this.list.byteLength;
    this.usage = descriptor.usage;
    this.mappedAtCreation = descriptor.mappedAtCreation;
  }

  /** Creates internal buffer using given device. Destroys already existing buffer if there is one. */
  public createBuffer(device: GPUDevice): GPUBuffer {
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
   * @param offset Offset to update from given in elements.
   * @param size
   */
  public updateBuffer(offset: GPUSize64 = 0, size?: GPUSize64) {
    if (!this.device || !this.buffer) return;
    if (this.buffer.size < this.list.byteLength) {
      this.buffer.destroy();
      this.createBuffer(this.device);
    }
    this.device.queue.writeBuffer(this.buffer, offset, this.list.data, offset, size);
  }

  /** 
   * Directly write to internal buffer using given data.
   * @param bufferOffset Offset in bytes into internal buffer to begin writing at.
   * @param bufferOffset Offset in bytes into internal buffer to begin writing at.
   * @param data Data to write into internal buffer.
   * @param dataOffset Offset in into data to begin writing from. Given in elements if data is a TypedArray and bytes otherwise.
   * @param size
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

type GeometryVertexAttribute = {
  format: GPUVertexFormat, 
  offset: number, 
  size: number, 
  bytes: number, 
  shaderLocation: number 
};

// Holds and manipulates vertex buffer for a geometry 
export class GeometryVertexBuffer extends GeometryBuffer {
  private attributes: Map<string, GeometryVertexAttribute> = new Map();
  private arrayStride: number;
  private vertexSize: number = 0;
  private calculateArrayStride: boolean;
  private locations: number = 0;
  private stepMode?: GPUVertexStepMode;

  constructor(list: TypedList, arrayStride?: number) {
    super({
      label: 'Vertex Buffer',
      list: list,
      size: list.length, 
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST 
    });
    this.arrayStride = arrayStride ?? 0;
    this.calculateArrayStride = (arrayStride === undefined);
  }

  // TODO: allow attribute overlapping AND better array stride calculations that allows defined attribute offsets
  public setAttribute(name: string, attribute: { format: GPUVertexFormat, offset?: number, shaderLocation?: number }) {
    if (attribute.offset !== undefined && this.calculateArrayStride) throw new Error('Attribute offset was given but vertex array stride is undefined.');
    if (attribute.offset === undefined && !this.calculateArrayStride) throw new Error('Vertex array stride was given but attribute offset is undefined.');

    const size = parseInt((attribute.format.match(/(?<=x)\d*/)?.[0] || '0'), 10);
    const typeBytes = parseInt((attribute.format.match(/\d*(?=x)/)?.[0] || '0'), 10) / 8;
    const bytes = typeBytes * size;

    this.attributes.set(name, {
      format: attribute.format,
      offset: attribute.offset ?? this.arrayStride,
      shaderLocation: attribute.shaderLocation ?? this.locations,
      size: size,
      bytes: bytes
    });

    this.locations = attribute.shaderLocation ? Math.max(attribute.shaderLocation + 1, this.locations + 1) : this.locations + 1;
    this.vertexSize += size;
    if (this.calculateArrayStride) {
      this.arrayStride += bytes;      
    }
  }

  public setAttributeData(name: string, data: ArrayLike<number>, vertexOffset: number = 0, dataOffset: number = 0, size?: number) {
    const attribute = this.attributes.get(name);
    if (!attribute) throw new Error(`Given attribute ${name} does not exist in geometry vertex buffer.`);
    let i = 0,
        upper = (size ? size : data.length),
        skip = this.vertexSize - attribute.size;
    vertexOffset = vertexOffset * skip + attribute.offset;
    this.list.increase(upper / attribute.size * this.vertexSize);
    while(i < upper) {
      this.list.data[vertexOffset] = data[dataOffset];
      i++;
      dataOffset++;
      if (i % attribute.size === 0) {
        vertexOffset += skip + 1;
      } else {
        vertexOffset++;
      }
    }
  }

  public getAttribute(name: string): GeometryVertexAttribute | undefined {
    return this.attributes.get(name);
  }

  public getLayout(): GPUVertexBufferLayout {
    return {
      arrayStride: this.arrayStride,
      attributes: [...this.attributes.values()].sort()
    } satisfies GPUVertexBufferLayout;
  }
}

export type GeometryDescriptor = {
  vertices: TypedList,
  vertexArrayStride?: number,
  indices?: TypedList
}

export class Geometry {
  public geometryBuffers: Map<string, GeometryBuffer> = new Map();
  public vertexBuffer: GeometryVertexBuffer;
  public indexBuffer?: GeometryBuffer;

  constructor(descriptor: GeometryDescriptor) {
    this.vertexBuffer = new GeometryVertexBuffer(descriptor.vertices, descriptor.vertexArrayStride);
    if (descriptor.indices) {
      this.indexBuffer = new GeometryBuffer({
        label: 'Index Buffer',
        data: descriptor.indices,
        size: descriptor.indices.length,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      });
    }
  }

  public createVertexAttribute(name: string, attribute: { format: GPUVertexFormat, offset?: number, shaderLocation?: number }): this {
    if (this.vertexBuffer.getAttribute(name) !== undefined) throw new Error('Duplicate vertex attribute name.');
    this.vertexBuffer.setAttribute(name, attribute);
    return this;
  }

  public setVertexAttributeData(name: string, data: ArrayLike<number>, vertexOffset: number = 0, dataOffset: number = 0, size?: number): this {
    this.vertexBuffer.setAttributeData(name, data, vertexOffset, dataOffset, size);
    return this;
  }

  public setBuffer(name: string, geometryBuffer: GeometryBuffer) {
    this.geometryBuffers.get(name)?.destroy();
    this.geometryBuffers.set(name, geometryBuffer);
  }

  public getGeometryMakeup() {
    return {
      buffers: [...this.geometryBuffers.keys()].sort(),
      vertexAttributes: [...this.vertexBuffer.attributes.keys()].sort(),
      useIndexBuffer: this.indexBuffer !== undefined
    };
  }
}