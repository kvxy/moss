import { EventEmitter } from '../utils/event-emitter';
import { GeometryAttribute, GeometryAttributeType } from './geometry-attribute';

/** Geometry attributes created by default geometry. */
type DefaultGeometryAttributeName = 'position' | 'color';

export type GeometryDescriptor = {
  /** What formats each default attribute should be. */
  defaultAttributes?: {
    [key: string]: { type: GeometryAttributeType, components: number }
  };
  /** If not false, default buffers and attributes will be created for the geometry,
   * which are compatable with the mesh renderer. */
  default?: boolean;
  /** If true, index buffer will be created. */
  indexed?: boolean;
  /** Format of index buffer. */
  indexFormat?: GPUIndexFormat;
};

export class Geometry extends EventEmitter {
  private static defaultAttributes: { name: string, type: GeometryAttributeType, components: number }[] = [
    { name: 'position', type: 'float32', components: 3 },
    { name: 'color', type: 'uint8', components: 4 }
  ];
  public attributes: Map<string, GeometryAttribute> = new Map();
  /* attributes that needs gpu update */
  public updateAttributes: Set<GeometryAttribute> = new Set();
  public indices?: GeometryAttribute;

  constructor(descriptor: GeometryDescriptor = {}) {
    super();
    if (descriptor.default !== false) {
      for (let attributeInfo of Geometry.defaultAttributes) {
        const format = (descriptor.defaultAttributes ? descriptor.defaultAttributes[attributeInfo.name] : undefined) ?? attributeInfo;
        this.createAttribute(attributeInfo.name, format.type, format.components);
      }
    }
    if (descriptor.indexed) {
      this.indices = new GeometryAttribute('index', 'uint32', 1);
    }
  }

  public addEventListener(type: 'destroy', listener: () => void): void;
  public addEventListener(type: string, listener: Function): void {
    super.addEventListener(type, listener);
  }

  public createAttribute(name: string, format: GeometryAttributeType, components: number) {
    if (components > 4 || components < 1) {
      throw new Error(`Number of components (${components}) not in range [1, 4].`);
    }
    this.attributes.set(name, new GeometryAttribute(name, format, components));
  }

  public setAttribute(name: DefaultGeometryAttributeName, array: ArrayLike<number>, readOffset?: number, writeOffset?: number, size?: number): void;
  public setAttribute(name: string, array: ArrayLike<number>, readOffset?: number, writeOffset?: number, size?: number): void;
  public setAttribute(name: string, array: ArrayLike<number>, readOffset: number = 0, writeOffset: number = 0, size?: number): void {
    const attribute = this.attributes.get(name);
    if (!attribute) {
      throw new Error(`Attribute ${name} does not exist in geometry.`);
    }
    attribute.update(array, readOffset, writeOffset, size);
    this.updateAttributes.add(attribute);
  }

  public setIndices(array: ArrayLike<number>, readOffset: number = 0, writeOffset: number = 0, size?: number) {
    if (!this.indices) {
      throw new Error('Index attribute not in geometry.');
    }
    this.indices.update(array, readOffset, writeOffset, size);
  }

  public destroy() {
    this.triggerEvent('destroy');
  }
}

