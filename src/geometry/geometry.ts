import { TypedList } from '../utils/typed-list';

export class GeometryBuffer {
  protected device?: GPUDevice;
  public buffer?: GPUBuffer;

  public name: string;
  public list: TypedList;
  public size: number;
  public usage: number;
  public mappedAtCreation?: boolean;

  constructor(name: string, data: TypedList, size: number, usage: number) {
    this.name = name;
    this.list = data;
    this.size = size;
    this.usage = usage;
  }

  public makeBuffer(device: GPUDevice) {
    this.buffer = device.createBuffer({
      label: this.name + ' Geometry Buffer',
      size: this.size,
      usage: this.usage,
      mappedAtCreation: this.mappedAtCreation
    });
  }

  public updateBuffer(bufferOffset: GPUSize64 = 0, dataOffset?: GPUSize64, size?: GPUSize64) {
    if (!this.device || !this.buffer) return;
    if (this.buffer.size < this.list.byteLength) {
      this.buffer.destroy();
      this.makeBuffer(this.device);
    }
    this.device.queue.writeBuffer(this.buffer, bufferOffset, this.list.data, dataOffset, size);
  }
}

export class GeometryVertexBuffer extends GeometryBuffer {
  public isGeometryVertexBuffer: boolean = true;

  public attributes: Map<string, { format: GPUVertexFormat, offset: number, size: number, shaderLocation: number }> = new Map();
  public arrayStride: number;
  public calculateArrayStride: boolean;
  public locations: number;
  public stepMode?: GPUVertexStepMode;

  constructor(data: TypedList, arrayStride?: number) {
    super('vertex', data, data.length, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
    this.arrayStride = arrayStride ?? 0;
    this.locations = 0;
    this.calculateArrayStride = arrayStride === undefined;
  }

  public setAttribute(name: string, attribute: { format: GPUVertexFormat, offset?: number, shaderLocation?: number }) {
    const size = parseInt((attribute.format.match(/(?<=[x])\d*/g)?.[0] || '0'), 10);
    this.attributes.set(name, {
      format: attribute.format,
      offset: attribute.offset ?? this.arrayStride,
      shaderLocation: attribute.shaderLocation ?? this.locations,
      size: size
    });
    this.locations = attribute.shaderLocation ? Math.max(attribute.shaderLocation + 1, this.locations + 1) : this.locations + 1;
    if (this.calculateArrayStride) {
      this.arrayStride += size;
    }
  }

  public setAttributeData(name: string, data: ArrayLike<number>, vertexOffset: number = 0, dataOffset: number = 0, size?: number) {
    const attribute = this.attributes.get(name);
    if (!attribute) throw new Error(`Given attribute ${name} does not exist in geometry vertex buffer.`);
    let i = 0,
        upper = (size ? size : data.length),
        skip = this.arrayStride - attribute.size;
    vertexOffset = vertexOffset * skip + attribute.offset;
    this.list.increase(upper / attribute.size * this.arrayStride);
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
}

export class GeometryIndexBuffer extends GeometryBuffer {
  public isGeometryIndexBuffer: boolean = true;

  constructor(data: TypedList) {
    super('index', data, data.length, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);
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
  public indexBuffer?: GeometryIndexBuffer;

  constructor(descriptor: GeometryDescriptor) {
    this.vertexBuffer = new GeometryVertexBuffer(descriptor.vertices, descriptor.vertexArrayStride);
    if (descriptor.indices) {
      this.indexBuffer = new GeometryIndexBuffer(descriptor.indices);
    }
  }

  public setVertexAttribute(name: string, attribute: { format: GPUVertexFormat, offset?: number, shaderLocation?: number }): this {
    this.vertexBuffer.setAttribute(name, attribute);
    return this;
  }

  public setVertexAttributeData(name: string, data: ArrayLike<number>, vertexOffset: number = 0, dataOffset: number = 0, size?: number): this {
    this.vertexBuffer.setAttributeData(name, data, vertexOffset, dataOffset, size);
    return this;
  }
}