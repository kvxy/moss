import { ResizableArrayView } from '../utils/resizable-array-view';
import { TypedArrayFormat, TypedArrayMapping } from '../utils/typed-array';
import { GeometryBuffer } from './geometry-buffer';

type GeometryVertexAttribute = {
  // to satisfy GPUVertexAttribute
  format: GPUVertexFormat, 
  offset: number, 
  shaderLocation: number,
  // for internal calculations
  components: number, 
  componentBytes: number,
  componentOffset: number
};

export type SetAttributeDataOptions = {
  /** Offset to write to, given in steps (vertices if stepMode='vertex', instances if stepMode='instance'). */
  vertexOffset?: number, 
  /** Offset from data, given in elements to start reading from. */
  dataOffset?: number, 
  /** Total number of elements to read from data. */
  size?: number, 
  /** If true, internal gpu buffer will be updated. */
  updateBuffer?: boolean
};

export type GeometryVertexAttributeDescriptor = { 
  /** Format of vertex attribute. */
  format: GPUVertexFormat, 
  /** Offset in bytes. */
  offset?: number, 
  /** Location of attribute in shader. */
  shaderLocation?: number 
};

export type GeometryVertexBufferDescriptor = {
  label?: string,
  arrayView?: ResizableArrayView,
  /** Defaults to true. If true, arrayStride, locations, and offsets are automatically calculated.*/
  auto?: boolean,
  arrayStride?: number,
  shaderLocationOffset?: number,
  stepMode?: GPUVertexStepMode,
  mappedAtCreation?: boolean
};

/** Holds vertex buffer & vertex array for a geometry.  */
export class GeometryVertexBuffer extends GeometryBuffer {
  private attributes: Map<string, GeometryVertexAttribute> = new Map();
  private arrayStride: number;
  private stepMode?: GPUVertexStepMode;
  private shaderLocationCount: number;
  private arrayComponentStride: number = 0; // 'arrayStride in elements'

  // if true, arrayStride, locations, offsets are automatically calculated
  private auto: boolean;

  constructor(descriptor: GeometryVertexBufferDescriptor) {
    super({
      label: descriptor.label ?? 'Vertex Buffer',
      arrayView: descriptor.arrayView,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: descriptor.mappedAtCreation
    });
    this.shaderLocationCount = descriptor.shaderLocationOffset ?? 0;
    this.arrayStride = descriptor.arrayStride ?? 0;
    this.auto = descriptor.auto ?? true;
    this.stepMode = descriptor.stepMode;
  }

  private getTypedArrayFormat(vertexFormat: GPUVertexFormat): TypedArrayFormat {
    const sign = vertexFormat.startsWith('s') ? 's' : 'u';
    const type = vertexFormat.startsWith('float') ? 'float' : 'int';
    const componentBits = parseInt((vertexFormat.match(/\d*(?=x)/)?.[0] || '0'), 10); // e.g. 32 from 'float32x2'
    return (type === 'float' ? type + componentBits : sign + type + componentBits) as TypedArrayFormat; 
  }

  /**
   * Creates an vertex attribute for the buffer.
   * @param key Key of the attribute.
   * @param attribute Description of the vertex attribute.
   */
  public createAttribute(key: string, attribute: GeometryVertexAttributeDescriptor) {
    if (this.attributes.get(key)) throw new Error('Duplicate attribute key.')
    if (!this.auto && !attribute.offset) throw new Error('Attribute offset must be given if auto=false.');
    if (!this.auto && !attribute.shaderLocation) throw new Error('Attribute shaderLocation must be given if auto=false.');
    
    const components = parseInt((attribute.format.match(/(?<=x)\d*/)?.[0] || '1'), 10); // e.g. 2 from 'float32x2' - defaults to 1
    const componentBytes = parseInt((attribute.format.match(/\d*(?=x)/)?.[0] || '0'), 10) / 8; // e.g. 32/8 from 'float32x2'
    const byteSize = componentBytes * components;
    const alignment = byteSize >= 4 ? 4 : 2; // alignment requirements

    let offset = attribute.offset ?? this.arrayStride;
    if (this.auto) 
      offset = (offset % alignment === 0) ? offset : offset + alignment + (offset % alignment);

    this.attributes.set(key, {
      format: attribute.format,
      offset: offset,
      shaderLocation: attribute.shaderLocation ?? this.shaderLocationCount,
      components: components,
      componentBytes: componentBytes,
      componentOffset: this.arrayComponentStride
    });

    this.arrayComponentStride += components;
    if (this.auto) {
      this.shaderLocationCount = attribute.shaderLocation ? Math.max(attribute.shaderLocation + 1, this.shaderLocationCount + 1) : this.shaderLocationCount + 1;
      this.arrayStride = Math.max(offset + byteSize, this.arrayStride);
    }
  }

  // this function is kinda yikes..
  /**
   * Sets vertex data for a single attribute.
   * @param key Key of attribute.
   * @param data Array of numbers.
   * @param options Attribute data options.
   */
  public setAttributeData(key: string, data: ArrayLike<number>, options?: SetAttributeDataOptions) {
    const attribute = this.attributes.get(key);
    if (!attribute) throw new Error(`Given attribute ${key} does not exist in geometry vertex buffer.`);

    const dataOffset = options?.dataOffset ?? 0,
          vertexOffset = options?.vertexOffset ?? 0,
          size = options?.vertexOffset,
          updateBuffer = options?.vertexOffset ?? false;

    let counter = 0,
        skip = (this.arrayStride - attribute.componentBytes * attribute.components) / attribute.componentBytes, // elements to skip after reaching end of step
        readIndex = dataOffset, // index to read from
        writeIndex = vertexOffset * skip + attribute.offset / attribute.componentBytes, // index to write to with respect to typedArray
        upper = (size ? size : (data.length - vertexOffset)), // number of elements to read
        verticesCount = upper / attribute.components; // number of vertices written to 

    this.arrayView.increase((vertexOffset + verticesCount) * this.arrayStride);
    const typedArray = this.arrayView.getTypedArray(this.getTypedArrayFormat(attribute.format));

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
   * Returns true if attribute with given key exists in vertex buffer.
   * @param key Key of attribute.
   * @returns true if attribute exists in vertex buffer, false otherwise.
   */
  public hasAttribute(key: string): boolean {
    return this.attributes.get(key) !== undefined;
  }

  /** @returns the vertex buffer layout. */
  public getLayout(): GPUVertexBufferLayout {
    return {
      arrayStride: this.arrayStride,
      attributes: [...this.attributes].sort(([a], [b]) => a.localeCompare(b)).map(([ _key, attribute ]) => attribute),
      stepMode: this.stepMode
    } satisfies GPUVertexBufferLayout;
  }
}