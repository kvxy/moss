import { ID } from '../utils/id';
import { GeometryBuffer } from './geometry-buffer';
import { GeometryVertexBuffer } from './geometry-vertex-buffer';

export type GeometryDescriptor = {
  label?: string,
  /** Creates index buffer if true with given indices data. */
  useIndices?: boolean,
  /** Creates 'default' vertex buffer if true with given vertices data. */
  createDefault?: boolean,
  /** Used to create default vertex buffer. */
  attributeFormats?: {
    position?: GPUVertexFormat,
    color?: GPUVertexFormat
  }
};

/** Holds and manipulates vertex data. */
export class Geometry {
  public label: string;

  // protected geometryBuffers: Map<string, GeometryBuffer> = new Map();
  protected vertexBuffers: Map<string, GeometryVertexBuffer> = new Map();
  protected vertexBufferLayouts?: GPUVertexBufferLayout[];
  public indexBuffer?: GeometryBuffer;

  public gpuInitialized: boolean = false;
  protected device?: GPUDevice;
  // public bindGroup?: GPUBindGroup;

  constructor(descriptor: GeometryDescriptor = {}) {
    this.label = descriptor.label ?? '';

    if (descriptor.createDefault !== false) {
      const vertexBuffer = new GeometryVertexBuffer({ 
        label: `${this.label} Default Vertex Buffer`,
        auto: true,
        stepMode: 'vertex'
      });
      vertexBuffer.createAttribute('position', { format: descriptor.attributeFormats?.position ?? 'float32x3' });
      vertexBuffer.createAttribute('color', { format: descriptor.attributeFormats?.color ?? 'uint8x4' });
      this.vertexBuffers.set('default', vertexBuffer);
    }
    if (descriptor.useIndices === true) {
      this.indexBuffer = new GeometryBuffer({
        label: `${this.label} Index Buffer`,
        size: 0,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      });
    }
  }

  /**
   * Adds vertex buffer with given key to geometry.
   * @param key Key of the vertex buffer.
   * @param vertexBuffer The geometry vertex buffer to use.
   */
  public setVertexBuffer(key: string, vertexBuffer: GeometryVertexBuffer) {
    if (this.getVertexBuffer(key) !== undefined) throw new Error(`Vertex buffer with key ${key} already exists.`);
    // this.vertexBuffers.get(key)?.destroy();
    this.vertexBuffers.set(key, vertexBuffer);
  }

  /**
   * @param key Key of vertex buffer.
   * @returns the vertex buffer with the given key, undefined if it doesn't exist.
   */
  public getVertexBuffer(key: string): GeometryVertexBuffer | undefined {
    return this.vertexBuffers.get(key);
  }

  /**
   * @param key Key of vertex buffer.
   * @returns the vertex buffer with the given key, throws an error if it doesn't exist. 
   */
  public requireVertexBuffer(key: string): GeometryVertexBuffer {
    const vertexBuffer = this.getVertexBuffer(key);
    if (!vertexBuffer) throw new Error(`Given vertex buffer with key ${key} does not exist in geometry.`);
    return vertexBuffer;
  }

  /** @returns default vertex buffer created at construction. */
  public getDefaultVertexBuffer(): GeometryVertexBuffer {
    return this.requireVertexBuffer('default');
  }

  /**
   * Adds geometry buffer with given key to geometry.
   * @param key Key of geometry buffer.
   * @param geometryBuffer The geometry buffer to use.
   *//*
  public setGeometryBuffer(key: string, geometryBuffer: GeometryBuffer) {
    if (this.getGeometryBuffer(key) !== undefined) throw new Error(`Geometry buffer with key ${key} already exists.`);
    geometryBuffer.addEventListener('onBufferCreate', () => {
      this.createBindGroup();
    });
    // this.geometryBuffers.get(key)?.destroy();
    this.geometryBuffers.set(key, geometryBuffer);
  }*/

  /**
   * @param key Key of geometry buffer.
   * @returns the geometry buffer with the given key, undefined if it doesn't exist.
   *//*
  public getGeometryBuffer(key: string): GeometryBuffer | undefined {
    return this.geometryBuffers.get(key);
  }*/

  /**
   * @param key Key of geometry buffer.
   * @returns the geometry buffer with the given key, throws an error if it doesn't exist. 
   *//*
  public requireGeometryBuffer(key: string): GeometryBuffer {
    const geometryBuffer = this.getGeometryBuffer(key);
    if (!geometryBuffer) throw new Error(`Given vertex buffer with key ${key} does not exist in geometry.`);
    return geometryBuffer;
  }*/

  /** 
   * Sets the device of geometry, done automatically on render.
   * @param device The GPUDevice to bind. */
  public bindDevice(device: GPUDevice) {
    if (this.device !== undefined && this.device !== device) throw new Error('GPUDevice already binded.');
    this.device = device;
  }

  /** Initialize all GPU buffers (if needed), done automatically on render. */
  public initializeGPUBuffers() {
    const device = this.device;
    if (!device) throw new Error(`Geometry ${this.label} has no GPUDevice binded.`);

    [/*...this.geometryBuffers.values(),*/ ...this.vertexBuffers.values(), this.indexBuffer].forEach(geometryBuffer => {
      if (!geometryBuffer) return;
      if (!geometryBuffer.gpuBuffer) {
        geometryBuffer.bindDevice(device);
        geometryBuffer.createGPUBuffer();
        geometryBuffer.updateGPUBuffer();
      }
    });
  }

  /** Creates the bind group for this geometry, done automatically on render. *//*
  public createBindGroup() {
    const device = this.device;
    if (!device) throw new Error(`Geometry ${this.label} has no GPUDevice binded.`);
    if (this.geometryBuffers.size === 0) return;

    const layoutEntries: GPUBindGroupLayoutEntry[] = [],
          entries: GPUBindGroupEntry[] = [];
    
    let binding = 0;
    this.geometryBuffers.forEach(geometryBuffer => {
      if (!geometryBuffer.gpuBuffer) throw new Error(`Geometry Buffer has no GPUBuffer, did you initialize GPU buffers?`);
      layoutEntries.push({
        binding: binding,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      });
      entries.push({
        binding: binding,
        resource: { buffer: geometryBuffer.gpuBuffer }
      });
      binding++;
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: `Geometry ${this.label} Bind Group Layout`,
      entries: layoutEntries
    });
    this.bindGroup = device.createBindGroup({
      label: `Geometry ${this.label} Bind Group`,
      layout: bindGroupLayout,
      entries: entries
    });

    this.gpuInitialized = true;
  }*/

  /** @returns Vertex buffer layouts. */
  public getVertexBufferLayouts(): GPUVertexBufferLayout[] {
    if (!this.vertexBufferLayouts)
      this.vertexBufferLayouts = [...this.vertexBuffers.values()].map(vertexBuffer => vertexBuffer.getLayout());
    return this.vertexBufferLayouts;
  }
}