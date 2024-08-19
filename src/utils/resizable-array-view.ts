import { TypedArray, TypedArrayFormat, TypedArrayMapping, TypedArrayConstructor } from './typed-array';

/** Dynamically resizing array buffer with multiple typed array views. */
export class ResizableArrayView {
  public factor: number = 2;

  public buffer: ArrayBufferLike;
  private typedArrays: Map<TypedArrayFormat, TypedArray> = new Map();
  private _byteLength: number = 0;

  constructor(byteLength: number);
  constructor(data: TypedArray);
  constructor(data: ArrayBufferLike);
  constructor(data: TypedArray | ArrayBufferLike | number) {
    if (typeof data === 'number') {
      this.buffer = new ArrayBuffer(data);
    } else if (data instanceof ArrayBuffer || data instanceof SharedArrayBuffer) {
      this.buffer = data;
    } else {
      this.buffer = data.buffer;
      this._byteLength = data.byteLength;
    }
    this.typedArrays.set('uint8', new Uint8Array(this.buffer));
  }

  /** How many elements internal buffer can hold in bytes. */
  public get capacity(): number {
    return this.buffer.byteLength;
  }


  /** Size in bytes of total length used. */
  public get byteLength(): number {
    return this._byteLength;
  }

  /** 
   * Resize buffer to given size.
   * @param byteLength The size to resize to.
  */
  public resize(byteLength: number) {
    const buffer = new (this.buffer.constructor as new (byteLength: number) => ArrayBufferLike)(byteLength);
    (new Uint8Array(buffer)).set(this.typedArrays.get('uint8') ?? new Uint8Array(this.buffer));
    this.typedArrays = new Map(); // reset internal typedArrays
    this.buffer = buffer;
  }

  /** Sets capacity (in bytes) to minimum power of `factor` needed to contain parameter `upper`.
   * @param upper 
   */
  public increase(upper: number) {
    if (upper > this.capacity) 
      this.resize(Math.pow(this.factor, Math.ceil(Math.log2(upper))));
  }

  /**
   * Returns TypedArray with internal ArrayBuffer.
   * @param format TypedArray format to get.
   * @returns TypedArray of given type with buffer.
   */
  public getTypedArray(format: TypedArrayFormat): TypedArray {
    let typedArray = this.typedArrays.get(format);
    if (typedArray === undefined) {
      typedArray = new (TypedArrayMapping.getConstructor(format))(this.buffer);
      this.typedArrays.set(format, typedArray);
    }
    return typedArray;
  }

  /** 
   * Sets a value or typed array of values.
   * @param data Typed array to copy data from.
   * @param offset Offset to write to buffer given in elements.
   */
  public set(data: TypedArray, offset: number = 0) {
    if (data.byteLength + offset >= this.capacity) {
      this.increase(offset + data.byteLength);
    }
    const typedArray = this.getTypedArray(TypedArrayMapping.getFormat(data.constructor as TypedArrayConstructor));
    typedArray.set(data, offset);
    this._byteLength = Math.max(this._byteLength, data.byteLength + offset);
  }
}