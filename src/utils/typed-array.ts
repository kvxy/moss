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

const typedArrayFormats = [
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

export type TypedArrayFormat = typeof typedArrayFormats[number];

const constructorFormatMap = new Map<TypedArrayConstructor, TypedArrayFormat>(typedArrayConstructors.map((constructor, i) => [ constructor, typedArrayFormats[i] ]));
const formatConstructorMap = new Map<TypedArrayFormat, TypedArrayConstructor>(typedArrayConstructors.map((constructor, i) => [ typedArrayFormats[i], constructor ]));

/** Conversion between typed array formats and their respective constructors. */
export const TypedArrayMapping = {
  getFormat: function(constructor: TypedArrayConstructor): TypedArrayFormat {
    const str = constructorFormatMap.get(constructor);
    if (!str) throw new Error(`TypedArray missing conversion for constructor ${constructor.name}`);
    return str;
  },
  getConstructor: function(format: TypedArrayFormat): TypedArrayConstructor {
    const constructor = formatConstructorMap.get(format);
    if (!constructor) throw new Error(`TypedArray missing conversion for format ${format}.`);
    return constructor;
  }
};