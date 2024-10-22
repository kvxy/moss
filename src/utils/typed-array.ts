export type TypedArray = 
  Float64Array |
  Float32Array |
  Int32Array |
  Int16Array |
  Int8Array |
  Uint32Array |
  Uint16Array |
  Uint8Array |
  Uint8ClampedArray;

const typedArrayConstructors = [
  Float64Array,
  Float32Array,
  Int32Array,
  Int16Array,
  Int8Array,
  Uint32Array,
  Uint16Array, 
  Uint8Array,
  Uint8ClampedArray
] as const;

export type TypedArrayConstructor = typeof typedArrayConstructors[number];

const typedArrayNames = [
  'float64',
  'float32',
  'sint32',
  'sint16',
  'sint8',
  'uint32',
  'uint16',
  'uint8',
  'uint8c'
] as const;

export type TypedArrayName = typeof typedArrayNames[number];

const constructorNameMap = new Map<TypedArrayConstructor, TypedArrayName>(typedArrayConstructors.map((constructor, i) => [ constructor, typedArrayNames[i] ]));
const nameConstructorMap = new Map<TypedArrayName, TypedArrayConstructor>(typedArrayConstructors.map((constructor, i) => [ typedArrayNames[i], constructor ]));

/** Conversion between typed array names and their respective constructors. */
export class TypedArrayMapping {
  /** Gets name of typed array constructor. */
  public static getName(constructor: TypedArrayConstructor): TypedArrayName {
    const str = constructorNameMap.get(constructor);
    if (!str) throw new Error(`TypedArray missing conversion for constructor ${constructor.name}`);
    return str;
  }
  /** Gets constructor of typed array name. */
  public static getConstructor(name: TypedArrayName): TypedArrayConstructor {
    const constructor = nameConstructorMap.get(name);
    if (!constructor) throw new Error(`TypedArray missing conversion for name ${name}.`);
    return constructor;
  }
};