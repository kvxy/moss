import { TypedArrayName, TypedArrayMapping } from '../../utils/typed-array';
import { Geometry } from '../geometry';
import { GeometryAttributeType, GeometryAttributeUpdateRange } from '../geometry-attribute';
import { WebGPUVertexBuffer } from './webgpu-vertex-buffer';

export class WebGPUGeometry {
  private device: GPUDevice;
  private vertexBuffers: Map<string, WebGPUVertexBuffer> = new Map();
  private indexBuffer?: GPUBuffer;
  private geometry: Geometry;

  constructor(geometry: Geometry, device: GPUDevice) {
    this.geometry = geometry;
    this.device = device;
    geometry.addEventListener('destroy', () => {
      // ...
    });

    
    for (const [name, attribute] of geometry.attributes) {
      const bytes = parseInt(attribute.type.match(/\d+/)?.[0] ?? '8', 10) / 8;
      
    }
  }

  public createBuffer(name: string) {
    this.vertexBuffers.set(name, new WebGPUVertexBuffer());
  }

  public updateBuffers() {
    for (const attribute of this.geometry.updateAttributes) {
      while(attribute.updateRanges.length > 0) {
        const range = attribute.updateRanges.pop() as GeometryAttributeUpdateRange;
        const buffer = this.vertexBuffers.get(attribute.buffer ?? 'default');
        if (buffer) {
          /*const constructor = TypedArrayMapping.getConstructor(attribute.typedArrayName);
          this.device.queue.writeBuffer(
            buffer, 
            range.writeOffset / attribute.bytesPerComponent, 
            new constructor(range.array), 
            range.readOffset, 
            range.size
          );*/
        }
      }
    }
  }

  public tick() {
    
  }
}