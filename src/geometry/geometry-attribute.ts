import { TypedArrayConstructor, TypedArrayMapping, TypedArrayName } from '../utils/typed-array';

export type GeometryAttributeType = 
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

export type GeometryAttributeUpdateRange = {
  array: ArrayLike<number>;
  readOffset: number;
  writeOffset: number;
  size?: number;
};

export class GeometryAttribute {
  public readonly updateRanges: GeometryAttributeUpdateRange[] = [];
  public readonly name: string;
  public readonly type: GeometryAttributeType;
  public readonly components: number;
  public readonly bytesPerComponent: number;
  public readonly typedArrayName: TypedArrayName;
  public readonly buffer?: string;
  
  constructor(name: string, format: GeometryAttributeType, components: number, buffer?: string) {
    this.name = name;
    this.type = format;
    this.components = components;
    this.buffer = buffer;

    this.bytesPerComponent = parseInt(format.match(/\d+/)?.[0] ?? '0', 10);
    if (this.bytesPerComponent === 0) {
      throw new Error('Invalid format.');
    }

    this.typedArrayName = this.getTypedArrayName(this.type);
  }

  public update(array: ArrayLike<number>, readOffset: number = 0, writeOffset: number = 0, size?: number) {
    this.updateRanges.push({ array, readOffset, writeOffset, size });
  }

  /**
   * Converts GPUVertexFormat to corresponding TypedArrayName.
   * @param vertexFormat The GeometryAttributeType to convert.
   * @returns The TypedArrayName of the corresponing attribute type.
   */ 
  private getTypedArrayName(attributeType: GeometryAttributeType): TypedArrayName {
    const sign = attributeType.startsWith('s') ? 's' : 'u';
    const type = attributeType.startsWith('float') ? 'float' : 'int';
    const bits = parseInt((attributeType.match(/\d+/)?.[0] || '0'), 10); // e.g. 32 from 'float32'
    return (type === 'float' ? type + bits : sign + type + bits) as TypedArrayName; 
  }
}