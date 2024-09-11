// import { EventEmitter } from '../event-emitter';

/** General vector class. **/
export class Vector /*extends EventEmitter*/ {
  [index: number]: number;

  private dimension: number;

  constructor(vector: Vector);
  constructor(dimension?: number);
  constructor(array: ArrayLike<number>);
  constructor(data: Vector | number | ArrayLike<number> | undefined) {
    if (data === undefined) {
      this.dimension = 0;
    } else if (typeof data === 'number') {
      this.dimension = data;
      for (let i = 0; i < data; i++)
        this[i] = 0;
    } else if (data instanceof Vector) {
      this.dimension = data.dimension;
      for (let i = 0; i < data.dimension; i++)
        this[i] = data[i];
    } else {
      this.dimension = data.length;
      for (let i = 0; i < data.length; i++)
        this[i] = data[i];
    }
  }

  /*public static projection(u: Vector, v: Vector) {
    const scalar = Vector.dot(u, v) / Vector.dot(v, v);
    return new Vector(v).scale(scalar);
  }

  public static dot(u: Vector, v: Vector): number {
    if (u.dimension !== v.dimension) throw new Error('Vector dimensions mismatch.');
    let out = 0;
    for (let i = 0; i < u.dimension; i++)
      out += u[i] * v[i];
    return out;
  }*/

  public equals(other: this) {
    if (this.dimension !== other.dimension) return false;
    for (let i = 0; i < this.dimension; i++) {
      if (this[i] !== other[i]) return false;
    }
    return true;
  }

  public copy(other: this) {
    this.dimension = other.dimension;
    for (let i = 0; i < other.dimension; i++)
      this[i] = other[i];
  }

  public clone(): this {
    return new (this.constructor as new (_this: this) => this)(this);
  }

  public add(other: this, modify: boolean = true): this {
    if (this.dimension !== other.dimension) throw new Error('Vector dimensions mismatch.');
    const vector: this = modify ? this : this.clone();
    for (let i = 0; i < vector.dimension; i++)
      vector[i] += other[i];
    return vector;
  }

  public subtract(other: this, modify: boolean = true): this {
    if (this.dimension !== other.dimension) throw new Error('Vector dimensions mismatch.');
    const vector: this = modify ? this : this.clone();
    for (let i = 0; i < vector.dimension; i++)
      vector[i] -= other[i];
    return vector;
  }

  public set(...numbers: any[]): this {
    const upper = Math.min(numbers.length, this.dimension);
    for (let i = 0; i < upper; i++) {
      this[i] = numbers[i];
    }
    return this;
  }

  public scale(scalar: number, modify?: boolean): this;
  public scale(scalar: this, modify?: boolean): this;
  public scale(scalar: number | this, modify: boolean = true): this {
    const vector = modify ? this : this.clone();
    if (typeof scalar === 'number') {
      for (let i = 0; i < vector.dimension; i++)
        vector[i] *= scalar;
    } else {
      if (this.dimension !== scalar.dimension) throw new Error('Vector dimensions mismatch.');
      for (let i = 0; i < vector.dimension; i++)
        vector[i] *= scalar[i];
    }
    return vector;
  }

  /*protected onUpdate() {
    this.triggerEvent('onUpdate', this.prev);
    for (let i = 0; i < this.dimension; i++) {
      this.prev[i] = this[i];
    }
  }

  public addEventListener(type: 'onUpdate', listener: (previous: number[]) => void): void;
  public addEventListener(type: string, listener: Function) {
    super.addEventListener(type, listener);
  }*/

  public fromJSON(json: any): this {
    const data = json as number[];
    this.dimension = data.length;
    for (let i = 0; i < data.length; i++)
      this[i] = data[i];
    return this;
  }

  public toJSON(): number[] {
    let data: number[] = [];
    for (let i = 0; i < this.dimension; i++)
      data.push(this[i]);
    return data;
  }
}

export class Vector2 extends Vector {  
  constructor(x: number, y: number);
  constructor(vector: Vector3);
  constructor(x: number | Vector3 = 0, y: number = 0) {
    super(2);
    if (typeof x === 'number') {
      this[0] = x;
      this[1] = y;
    } else {
      this[0] = x.x;
      this[1] = x.y;
    }
  }

  public get x(): number {
    return this[0];
  }

  public get y(): number {
    return this[1];
  }

  public set x(num: number) {
    this[0] = num;
  }

  public set y(num: number) {
    this[1] = num;
  }
}

export class Vector3 extends Vector {  
  constructor(x: number, y: number, z: number);
  constructor(vector: Vector3);
  constructor(x: number | Vector3 = 0, y: number = 0, z: number = 0) {
    super(3);
    if (typeof x === 'number') {
      this[0] = x;
      this[1] = y;
      this[2] = z;
    } else {
      this[0] = x.x;
      this[1] = x.y;
      this[2] = x.z;
    }
  }

  public get x(): number {
    return this[0];
  }

  public get y(): number {
    return this[1];
  }

  public get z(): number {
    return this[2];
  }

  public set x(num: number) {
    this[0] = num;
  }

  public set y(num: number) {
    this[1] = num;
  }

  public set z(num: number) {
    this[2] = num;
  }

  public set(x: number, y: number, z: number): this {
    return super.set(x, y, z);
  }
}

// Alternate syntax to construct vectors
// e.g. vec2(0, 1).add(vec2(2, 3)).scale(vec2(4, 5));

export const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);
export const vec3 = (x: number, y: number, z: number): Vector3 => new Vector3(x, y, z);