import { BufferView } from '../utils/buffer-view';
import { TypedArrayFormat } from '../utils/typed-array';

type GeometryVertexAttribute = {
  // - to satisfy GPUVertexAttribute
  format: GPUVertexFormat, 
  /** Offset in bytes */
  offset: number,
  shaderLocation: number,
  
  // - for internal calculations
  byteSize: number,
  components: number,
  componentBytes: number
};

export type GeometryVertexAttributeDescriptor = {
  /** Format of vertex attribute. */
  format: GPUVertexFormat, 
  /** Offset in bytes. */
  offset?: number, 
  /** Location of attribute in shader. */
  shaderLocation: number
};

export type SetAttributeOptions = {
  /** Offset to write to, given in steps (vertices if stepMode='vertex', instances if stepMode='instance'). */
  vertexOffset?: number, 
  /** Offset to read from, given in elements to start reading from in supplied data. */
  dataOffset?: number, 
  /** Total number of elements to read from supplied data. */
  size?: number, 
  /** If true, internal gpu buffer will be minimally updated according to vertexOffset and size. */
  updateBuffer?: boolean,
  /** If true, buffer will resize if setAttribute call exceeds buffer size. */
  resize?: boolean
  // TODO: 
  /** Number of components in data. 
   * For example, if the attribute format has 3 components (e.g. 'float32x3') and components=2, componentOffset = 1; 
   * the setAttribute call will only update the Y and Z components (skips X component). */
  //components?: number,
  /** Component offset to read from given data. */
  //componentOffset?: number
};

type VertexBufferCacheEntry = {
  attributes: Map<string, GeometryVertexAttribute>,
  references: number
};

export type VertexBufferDescriptor = {
  label?: string,
  mappedAtCreation?: boolean,
  size: number,
  arrayStride?: number,
  stepMode?: GPUVertexStepMode
  slot?: number
};

export class VertexBuffer extends BufferView {
  /** Cache for reused attribute layouts for memory efficiency. */
  private static cache: Map<string, VertexBufferCacheEntry> = new Map();

  // Could refer to an element in attributeCache.
  // Note: attribute layouts are locked when the buffer is GPU-initialized, so they are cached on bind.
  private attributes: Map<string, GeometryVertexAttribute> = new Map();
  private cacheKey?: string;
  // ranges of bytes used by attributes, used for overlap check.
  private attributeByteRanges: [number, number][] = [];

  private arrayStride: number;
  private stepMode?: GPUVertexStepMode;
  public readonly slot: number;

  constructor(descriptor: VertexBufferDescriptor) {
    super({
      label: descriptor.label,
      mappedAtCreation: descriptor.mappedAtCreation,
      size: descriptor.size,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      resizable: true
    });
    this.arrayStride = descriptor.arrayStride ?? 0;
    this.stepMode = descriptor.stepMode;
    this.slot = descriptor.slot ?? 0;
  }

  /**
   * Creates an vertex attribute for the buffer.
   * @param key Key of the attribute.
   * @param attribute Description of the vertex attribute to create.
   */
  public createAttribute(key: string, attribute: GeometryVertexAttributeDescriptor) {
    if (this.cacheKey) throw new Error('Vertex buffer can not create any new attributes after gpu-initialization.');
    if (this.attributes.has(key)) throw new Error('Duplicate attribute key.');
    
    const components = parseInt((attribute.format.match(/(?<=x)\d*/)?.[0] || '1'), 10); // e.g. 2 from 'float32x2' - defaults to 1
    const componentBytes = parseInt((attribute.format.match(/\d*(?=x)/)?.[0] || '0'), 10) / 8; // e.g. (32/8 = 4 bytes) from 'float32x2'
    const byteSize = componentBytes * components;
    const alignment = byteSize >= 4 ? 4 : 2; // aligned to 4 or 2 bytes

    let offset = attribute.offset ?? this.arrayStride; // (in bytes)
    // calculate alignment if attribute.offset isn't supplied
    if (!attribute.offset && offset % alignment !== 0) 
      offset = offset + alignment - (offset % alignment);

    this.attributes.set(key, {
      format: attribute.format,
      offset: offset,
      shaderLocation: attribute.shaderLocation,

      byteSize: byteSize,
      components: components,
      componentBytes: componentBytes
    });

    this.arrayStride = Math.max(offset + byteSize, this.arrayStride);
    this.attributeByteRanges.push([offset, offset + byteSize]);

    // some warnings if attribute.offset is supplied
    if (!attribute.offset) return;
    if (attribute.offset % alignment !== 0)
      console.warn('Given attribute offset not aligned properly.');
    for (let range of this.attributeByteRanges) {
      if (attribute.offset < range[1] && attribute.offset + byteSize > range[0]) {
        console.warn(`Given attribute with key '${key}' overlaps with another attribute.`);
        break;
      }
    }
  }

  // TODO: unorm10-10-10-2 and half-floats (no half-float typed arrays) conversion
  /**
   * Converts GPUVertexFormat to corresponding TypedArrayFormat.
   * @param vertexFormat The GPUVertexFormat to convert.
   * @returns The TypedArrayFormat (can be used with this.getTypedArray() to get array of that type)
   */ 
  private getTypedArrayFormat(vertexFormat: GPUVertexFormat): TypedArrayFormat {
    const sign = vertexFormat.startsWith('s') ? 's' : 'u';
    const type = vertexFormat.startsWith('float') ? 'float' : 'int';
    const bits = parseInt((vertexFormat.match(/\d*(?=x)/)?.[0] || '0'), 10); // e.g. 32 from 'float32x2'
    return (type === 'float' ? type + bits : sign + type + bits) as TypedArrayFormat; 
  }

  // TODO: Clean up this function
  /**
   * Sets vertex data for a single attribute.
   * @param key Key of attribute.
   * @param data Array of numbers.
   * @param options Attribute set options.
   */
  public setAttribute(key: string, data: ArrayLike<number>, options: SetAttributeOptions = {}) {
    const attribute = this.attributes.get(key);
    if (!attribute) throw new Error(`Attribute ${key} is not in vertex buffer.`);

    const dataOffset = options.dataOffset ?? 0,
          vertexOffset = options.vertexOffset ?? 0,
          size = options.vertexOffset,
          updateBuffer = options.vertexOffset ?? false

    let counter = 0,
        skip = (this.arrayStride - attribute.byteSize) / attribute.componentBytes, // elements to skip after reaching end of step
        readIndex = dataOffset, // index to read from
        writeIndex = vertexOffset * skip + attribute.offset / attribute.componentBytes, // index to write to with respect to typedArray
        upper = (size ? size : (data.length - vertexOffset)), // number of elements to read
        verticesCount = upper / attribute.components; // number of vertices written to 
    
    if (this.getTypedArray(this.getTypedArrayFormat(attribute.format)).length < writeIndex + upper) {
      if (options.resize === false) 
        throw new Error(`Buffer (${this.arrayBuffer.byteLength} bytes) is smaller than size required for setAttribute call (${(writeIndex + upper) * attribute.componentBytes} bytes).`);
      // else (options.resize === true or undefined):
      this.resize((vertexOffset + verticesCount) * this.arrayStride);
    }

    const typedArray = this.getTypedArray(this.getTypedArrayFormat(attribute.format)); // array of attribute type

    while(counter < upper) {
      typedArray[writeIndex] = data[readIndex];
      counter++;
      readIndex++;
      writeIndex++;
      if (counter % attribute.components === 0)
        writeIndex += skip;
    }

    if (updateBuffer) {
      const offset = vertexOffset * skip * attribute.componentBytes + attribute.offset;
      this.updateGPUBuffer(offset, verticesCount * this.arrayStride - offset % this.arrayStride);
    }
  }

  /**
   * Creates GPU resources and binds device. Called internally.
   * @param device 
   */
  public gpuInitialize(device: GPUDevice) {
    if (this.device) throw new Error('VertexBuffer already gpu-initialized.');
    this.device = device;

    // create & update buffer
    this.createGPUBuffer(device);
    this.updateGPUBuffer();

    // cache attributes as it is now inmutable (attribute layout not attribute data)
    if (this.cacheKey === undefined) {
      this.cacheKey = [...this.attributes]
        .sort((a, b) => a[1].shaderLocation - b[1].shaderLocation)
        .map(([_key, attribute]) => `${_key},${attribute.format},${attribute.offset},${attribute.shaderLocation}`)
        .join(';');
    }
    const cacheEntry = VertexBuffer.cache.get(this.cacheKey);

    if (cacheEntry) {
      this.attributes = cacheEntry.attributes;
      cacheEntry.references++;
    } else {
      VertexBuffer.cache.set(this.cacheKey, {
        attributes: this.attributes,
        references: 1
      });
    }
  }

  /** @returns the vertex buffer layout. */
  public getLayout(): GPUVertexBufferLayout {
    return {
      arrayStride: this.arrayStride,
      attributes: [...this.attributes.values()].sort((a, b) => a.shaderLocation - b.shaderLocation),
      stepMode: this.stepMode
    } satisfies GPUVertexBufferLayout;
  }

  /** Destroys this vertex buffer. */
  public destroy() {
    super.destroy();

    // update cache info
    if (!this.cacheKey || !this.device) return;
    const cacheEntry = VertexBuffer.cache.get(this.cacheKey);
    if (!cacheEntry) return;
    cacheEntry.references--;
    if (cacheEntry.references === 0)
      VertexBuffer.cache.delete(this.cacheKey);
  }

  public get layoutKey(): string | undefined {
    return this.cacheKey;
  }
}