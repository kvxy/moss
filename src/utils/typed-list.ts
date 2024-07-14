type TypedArray = Float64Array | Float32Array | Int32Array | Int16Array | Int8Array | Uint32Array | Uint16Array | Uint8Array | Uint8ClampedArray;

// Dynamically resizing typed array
export class TypedList {
  public factor: number = 2;

  public data: TypedArray;
  private _length: number; // used length

  constructor(data: TypedArray) {
    this.data = data;
    this._length = 0;
  }

  public get length(): number {
    return this._length;
  }

  public get size(): number {
    return this.data.length;
  }

  public get byteLength(): number {
    return this.data.byteLength;
  }

  // resize list to some size
  public resize(size: number) {
    const data = new (this.data.constructor as new (_size: number) => TypedArray)(size);
    data.set(this.data);
    this.data = data;
  }

  // increase list given upper limit (if needed)
  public increase(upper: number) {
    if (upper > this.size) {
      this.resize(Math.pow(this.factor, Math.ceil(Math.log2(upper))));
    }
  }

  public set(array: ArrayLike<number>, offset: number = 0) {
    if (array.length + offset >= this.size) {
      this.increase(offset + array.length);
    }
    this.data.set(array, offset);
    this._length = Math.max(this._length, array.length + offset);
  }
}