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
  'float64' as 'float64',
  'float32' as 'float32',
  'sint32' as 'sint32',
  'sint16' as 'sint16',
  'sint8' as 'sint8',
  'uint32' as 'uint32',
  'uint16' as 'uint16',
  'uint8' as 'uint8',
  'uint8c' as 'uint8c'
] as const;

export type TypedArrayFormat = typeof typedArrayFormats[number];

const constructorFormatMap = new Map<TypedArrayConstructor, TypedArrayFormat>(typedArrayConstructors.map((constructor, i) => [ constructor, typedArrayFormats[i] ]));
const formatConstructorMap = new Map<TypedArrayFormat, TypedArrayConstructor>(typedArrayConstructors.map((constructor, i) => [ typedArrayFormats[i], constructor ]));

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