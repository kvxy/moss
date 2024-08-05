import { ResizableTypedArrays } from '../utils/resizable-typed-arrays';
import { GeometryBuffer } from './geometry-buffer';
import { GeometryVertexBuffer } from './geometry-vertex-buffer';

export type GeometryDescriptor = {
  vertices: ResizableTypedArrays,
  indices?: ResizableTypedArrays,
}

/** Holds and manipulates vertex data for a mesh. */
export class Geometry {
  /** General use buffers. */
  public geometryBuffers: Map<string, GeometryBuffer> = new Map();
  /** Vertex buffers. */
  public vertexBuffers: Map<string, GeometryVertexBuffer> = new Map();
  /** Index buffer. */
  public indexBuffer?: GeometryBuffer;

  constructor(descriptor: GeometryDescriptor) {
    this.vertexBuffers.set('default', new GeometryVertexBuffer({ 
      list: descriptor.vertices,
      auto: true,
      stepMode: 'vertex'
    }));
    if (descriptor.indices) {
      this.indexBuffer = new GeometryBuffer({
        label: 'Index Buffer',
        list: descriptor.indices,
        size: descriptor.indices.length,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      });
    }
  }

  public setVertexBuffer(key: string, vertexBuffer: GeometryVertexBuffer) {
    // if (this.getVertexBuffer(key) !== undefined) console.warn(`Overriding vertex buffer with key ${key}.`);
    this.vertexBuffers.get(key)?.destroy();
    this.vertexBuffers.set(key, vertexBuffer);
  }

  /** Returns the vertex buffer with the given key, if it exists. */
  public getVertexBuffer(key: string): GeometryVertexBuffer | undefined {
    return this.vertexBuffers.get(key);
  }

  /** Returns the vertex buffer with the given key, throws an error if it doesn't exist. */
  public requireVertexBuffer(key: string): GeometryVertexBuffer {
    const vertexBuffer = this.getVertexBuffer(key);
    if (!vertexBuffer) throw new Error(`Given vertex buffer with key ${key} does not exist in geometry.`);
    return vertexBuffer;
  }

  /** */
  public setBuffer(key: string, geometryBuffer: GeometryBuffer) {
    // if (this.getVertexBuffer(key) !== undefined) console.warn(`Overriding geometry buffer with key ${key}.`);
    this.geometryBuffers.get(key)?.destroy();
    this.geometryBuffers.set(key, geometryBuffer);
  }
}