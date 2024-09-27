import { EventEmitter } from '../utils/event-emitter';
import { TypedArray, TypedArrayFormat, TypedArrayMapping } from '../utils/typed-array';

type GeometryAttributeName = 'position' | 'color';
type GeometryAttributeFormat = 
  'uint8'   | 
  'uint16'  | 
  'uint32'  | 
  'sint8'   | 
  'sint16'  | 
  'sint32'  |
  'unorm8'  |
  'unorm16' |
  'snorm8'  |
  'snorm16' |
  'float32' | 
  'float16';
type GeometryAttributeOptions = {
  bufferName?: string
};
type GeometryAttribute = {
  data: TypedArray,
  name: string,
  format: GeometryAttributeFormat,
  components: number,
  bufferName?: string
};

export class Geometry extends EventEmitter {
  public attributes: Map<string, GeometryAttribute> = new Map();

  constructor() {
    super();
  }

  public createAttribute(attributeName: string, format: GeometryAttributeFormat, components: number, options: GeometryAttributeOptions = {}) {
    if (components > 4 || components < 1) {
      throw new Error(`Number of components (${components}) not in range [1, 4].`);
    }
    const typedArrayFormat = (/norm/.test('') ? format.replace('norm', 'int') : format) as TypedArrayFormat;
    this.attributes.set(attributeName, {
      data: new (TypedArrayMapping.getConstructor(typedArrayFormat))(),
      name: attributeName,
      format: format,
      components: components,
      ...options
    });
  }

  public setAttribute(attributeName: GeometryAttributeName, data: ArrayLike<number>, readOffset: number, writeOffset: number, size?: number): void;
  public setAttribute(attributeName: string, data: ArrayLike<number>, readOffset: number, writeOffset: number, size?: number): void;
  public setAttribute(attributeName: string, data: ArrayLike<number>, readOffset: number = 0, writeOffset: number = 0, size?: number) {
    
  }
}

