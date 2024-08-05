import { ResizableTypedArrays } from '../utils/resizable-typed-arrays';
import { TypedArrayFormat } from '../utils/typed-array';
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

export type GeometryVertexBufferDescriptor = {
  typedArrays?: ResizableTypedArrays,
  /** Defaults to true. If true, arrayStride, locations, and offsets are automatically calculated.*/
  auto?: boolean,
  arrayStride?: number,
  shaderLocationOffset?: number
  stepMode?: GPUVertexStepMode;
};

/** Holds vertex buffer & vertex array for a geometry.  */
export class GeometryVertexBuffer extends GeometryBuffer {
  private attributes: Map<string, GeometryVertexAttribute> = new Map();
  private arrayStride: number;
  private shaderLocationCount: number;
  private stepMode?: GPUVertexStepMode;
  private arrayComponentStride: number = 0; // arrayStride in elements

  // if true, arrayStride, locations, offsets are automatically calculated
  private auto: boolean;

  constructor(descriptor: GeometryVertexBufferDescriptor) {
    super({
      label: 'Vertex Buffer',
      typedArrays: descriptor.typedArrays,
      size: descriptor.typedArrays?.byteLength, 
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST 
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
  public createAttribute(key: string, attribute: { format: GPUVertexFormat, offset?: number, shaderLocation?: number }) {
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

  /**
   * Sets vertex data for a single attribute.
   * @param key Key of attribute.
   * @param data Array of numbers.
   * @param vertexOffset Offset to write to, given in steps (vertices if stepMode='vertex').
   * @param dataOffset Offset from data, given in elements to start reading from.
   * @param size Total number of elements to read from data.
   * @param updateBuffer If true, internal buffer will be updated.
   */
  public setAttributeData(key: string, data: ArrayLike<number>, vertexOffset: number = 0, dataOffset: number = 0, size?: number, updateBuffer: boolean = false) {
    const attribute = this.attributes.get(key);
    if (!attribute) throw new Error(`Given attribute ${key} does not exist in geometry vertex buffer.`);
    
    /*const typedArray = this.typedArrays.getTypedArray(this.getTypedArrayFormat(attribute.format));
    let counter = 0,
        lowerBytes = vertexOffset * this.arrayStride + attribute.offset,
        upperBytes = size ? (size * attribute.componentBytes) : data.length * attribute.componentBytes,
        readIndex = dataOffset,
        skip = this.arrayComponentStride - attribute.components,
        writeIndex = vertexOffset * skip + attribute.componentOffset;
    while (lowerBytes < upperBytes) {
      typedArray[writeIndex] = data[readIndex];
      counter++;
      readIndex++;
      if (counter % attribute.components === 0) {
        lowerBytes += skip * (attribute.componentBytes + 1);
        writeIndex += skip + 1;
      } else {
        writeIndex ++;
        lowerBytes += attribute.componentBytes;
      }
    }*/

    const typedArray = this.typedArrays.getTypedArray(this.getTypedArrayFormat(attribute.format));
    let counter = 0,
        skip = this.arrayComponentStride - attribute.components,
        readIndex = dataOffset,
        writeIndex = vertexOffset,
        upper = (size ? size : data.length);
    vertexOffset = vertexOffset * skip + attribute.componentOffset;
    this.typedArrays.increase(upper / attribute.components * this.componentsPerStep);
    while(counter < upper) {
      typedArray[vertexOffset] = data[dataOffset];
      counter++;
      dataOffset++;
      if (counter % attribute.components === 0) {
        vertexOffset += skip + 1;
      } else {
        vertexOffset++;
      }
    }
    if (updateBuffer) 
      this.updateGPUBuffer(vertexOffset * skip + attribute.componentOffset, size);
  }

  /** Returns true if attribute with given key exists in vertex buffer. */
  public hasAttribute(key: string): boolean {
    return this.attributes.get(key) !== undefined;
  }

  /** Gets the vertex buffer layout. */
  public getLayout(): GPUVertexBufferLayout {
    return {
      arrayStride: this.arrayStride,
      attributes: [...this.attributes].sort(([a], [b]) => a.localeCompare(b)).map(([ _key, attribute ]) => attribute),
      stepMode: this.stepMode
    } satisfies GPUVertexBufferLayout;
  }

  /** Unique identifier for vertex buffer layout, used for cacheing. */
  public getLayoutHash(): string {
    return this.getLayout.toString();
  }
}