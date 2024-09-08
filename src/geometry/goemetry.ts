import { BufferView } from '../utils/buffer-view';
import { SetAttributeOptions, VertexBuffer } from './vertex-buffer';

export type GeometryVertexBufferOptions = {
  /** Name of buffer. */
  //name: string,
  /** Optional label of buffer. */
  label?: string,
  /** Size of buffer in bytes. */
  //size: number,
  /** Vertex buffer slot to set. */
  slot?: number,
  /** Mapped at creation. */
  mappedAtCreation?: boolean
};

export type CreateAttributeOptions = {
  /** Name of buffer that holds this attribute. Defaults to default buffer. */
  bufferName?: string,
  /** Shader location of attribute. */
  shaderLocation?: number,
  /** Offset of attribute in bytes. */
  offset?: number
};

export type GeometryDescriptor = {
  /** What formats each default attribute should be. */
  attributeFormats?: {
    [key: string]: GPUVertexFormat
  },
  /** If not false, default buffers and attributes will be created for the geometry,
   * which are compatable with the mesh renderer. */
  default?: boolean,
  /** If true, index buffer will be created. */
  indexed?: boolean,
  /** Format of index buffer. */
  indexFormat?: GPUIndexFormat
};

/** Holds and manipulates vertex data.
 * - Recommended to use default attributes if you want geometry to be renderable with mesh rasterizer. */
export class Geometry {
  private static defaultAttributes: { name: string, format: GPUVertexFormat, shaderLocation?: number, bufferName?: string }[] = [
    { name: 'position', format: 'float32x3' },
    { name: 'color', format: 'uint8x4' }
  ];

  private device?: GPUDevice;
  public vertexBuffers: Map<string, VertexBuffer> = new Map();
  /** Vertex buffer slots used. */
  private vertexBufferSlots: number[] = [];
  private _layoutsKey?: string;
  /** Describes which vertex buffers holds which attributes. */
  private attributeBufferName: Map<string, string> = new Map();
  /** Shader locations used. */
  private shaderLocations: number[] = [];
  private indexBuffer?: BufferView;
  private indexFormat?: GPUIndexFormat;

  constructor(descriptor: GeometryDescriptor = {}) {
    if (descriptor.default !== false) {
      this.createBuffer({ 
        label: 'Geometry Vertex Buffer',
        name: 'default', 
        size: 0
      });
      for (let attributeInfo of Geometry.defaultAttributes) {
        const format = (descriptor.attributeFormats ? descriptor.attributeFormats[attributeInfo.name] : undefined) ?? attributeInfo.format;
        this.createAttribute(attributeInfo.name, format, {
          bufferName: attributeInfo.bufferName,
          shaderLocation: attributeInfo.shaderLocation
        });
      }
    }
    if (descriptor.indexed) {
      this.indexBuffer = new BufferView({
        label: 'Geometry Index Buffer',
        size: 0,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        resizable: true
      });
      this.indexFormat = descriptor.indexFormat ?? 'uint32';
    }
  }

  /** 
   * @param array The supplied array.
   * @returns minimal unsigned integer not in given array. 
   */
  private getAvailableHelper(array: number[]) {
    // not optimal but it's fine since given arrays won't be that large anyways for the use cases
    array.sort();
    let num = 0;
    for (let i = 0; i < array.length; i++) {
      if (num !== array[i]) break; // found available location
      num++;
    }
    return num;
  }

  /**
   * Marks shader location as used.
   * @param location The location to mark.
   */
  private markShaderLocation(location: number) {
    if (this.shaderLocations.indexOf(location) !== -1)
      throw new Error(`Shader location ${location} is already in use!`);
    this.shaderLocations.push(location);
  }

  /**
   * Marks shader location as used.
   * @param location The location to mark.
   */
  private markVertexBufferSlot(slot: number) {
    if (this.vertexBufferSlots.indexOf(slot) !== -1)
      throw new Error(`Vertex buffer slot ${slot} is already in use!`);
    this.vertexBufferSlots.push(slot);
  }

  /**
   * Creates new vertex buffer for geometry.
   * @param descriptor Descriptor of vertex buffer.
   * @returns this.
   */
  public createBuffer(name: string, size: number, options: GeometryVertexBufferOptions): this {
    if (this.vertexBuffers.has(name)) throw new Error(`Vertex buffer with ${name} already exists in geometry.`);
    const slot = options.slot ?? this.getAvailableHelper(this.vertexBufferSlots);
    this.markVertexBufferSlot(slot);
    this.vertexBuffers.set(name, new VertexBuffer({
      label: `Geometry Vertex Buffer ${name}`,
      size: size,
      ...options
    }));
    return this;
  }

  /**
   * Creates an vertex attribute for the buffer.
   * @param key Key of the attribute.
   * @param attribute Description of the vertex attribute to create.
   * @returns this.
   */
  public createAttribute(name: string, format: GPUVertexFormat, options: CreateAttributeOptions = {}): this {
    if (this.attributeBufferName.has(name)) throw new Error(`Attribute with ${name} already exists in geometry.`);
    const bufferName = options.bufferName ?? 'default';
    const vertexBuffer = this.vertexBuffers.get(bufferName);
    if (vertexBuffer === undefined) throw new Error(`Buffer ${bufferName} does not exist in geometry.`);
    const location = options.shaderLocation ?? this.getAvailableHelper(this.shaderLocations);
    vertexBuffer.createAttribute(bufferName, {
      format: format,
      shaderLocation: location,
      offset: options.offset
    });
    this.markShaderLocation(location);
    return this;
  }

  /**
   * Sets vertex data for a single attribute.
   * @param key Key of attribute.
   * @param data Array of numbers.
   * @param options Attribute set options.
   * @returns this.
   */
  public setAttribute(attributeName: string, data: ArrayLike<number>, options: SetAttributeOptions = {}): this {
    const bufferName = this.attributeBufferName.get(attributeName);
    if (!bufferName) throw new Error(`Attribute ${attributeName} not in geometry.`);
    const buffer = this.vertexBuffers.get(bufferName);
    if (!buffer) throw new Error(`Buffer not found. This error should never be thrown unless vertex buffers map was modified.`);
    // if (options.resize === undefined) options.resize = true; // geometry vertex buffer resizes by default
    buffer.setAttribute(attributeName, data, options);
    return this;
  }

  /**
   * Sets the indices of this geometry.
   * @param data Data to set.
   * @param dataOffset Offset in elements to read from.
   * @param bufferOffset Offset in elements to write to.
   * @param size Size in elements to read from.
   * @returns this.
   */
  public setIndices(data: ArrayLike<number>, dataOffset: number = 0, bufferOffset: number = 0, size?: number): this {
    if (!this.indexBuffer || !this.indexFormat)
      throw new Error('Index buffer not initialized. Set indexed=true when constructing geometry.');
    size = size ?? data.length;
    const upper = bufferOffset + size;
    if (this.indexBuffer.getTypedArray(this.indexFormat).length < upper)
      this.indexBuffer.resize(upper);
    this.indexBuffer.getTypedArray(this.indexFormat).set(data, bufferOffset);
    return this;
  }

  /**
   * Creates GPU resources and binds device. Called internally.
   * @param device The device to bind to.
   */
  public gpuInitialize(device: GPUDevice) {
    //if (this.device) throw new Error('Geometry already gpu-initialized.');
    if (this.device) return;
    this.device = device;
    this.indexBuffer?.createGPUBuffer(device);
    for (let vertexBuffer of this.vertexBuffers.values()) {
      vertexBuffer.gpuInitialize(device);
    }

    // generate layouts key
    let keys: string[] = [];
    for (let [_name, vertexBuffer] of [...this.vertexBuffers].sort(([a], [b]) => a.localeCompare(b))) {
      if (!vertexBuffer.layoutKey) throw new Error('Vertex buffer layout key can not be generated before gpu-initialization.');
      keys.push(vertexBuffer.layoutKey);
    }
    this._layoutsKey = keys.join(':');
  }

  /** @returns Vertex buffer layouts. */
  public getVertexBufferLayouts(): GPUVertexBufferLayout[] {
    return [...this.vertexBuffers.values()].map(vertexBuffer => vertexBuffer.getLayout());
  }

  /** A unique key for every geometry unique vertex buffer layouts. */
  public get layoutsKey(): string | undefined {
    return this._layoutsKey;
  }
}