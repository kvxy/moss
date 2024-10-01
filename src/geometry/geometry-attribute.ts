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
  public updateRanges: GeometryAttributeUpdateRange[] = [];
  public name: string;
  public format: GeometryAttributeType;
  public components: number;
  
  constructor(name: string, format: GeometryAttributeType, components: number) {
    this.name = name;
    this.format = format;
    this.components = components;
  }

  public update(array: ArrayLike<number>, readOffset: number = 0, writeOffset: number = 0, size?: number) {
    this.updateRanges.push({ array, readOffset, writeOffset, size });
  }
}